import type { ToolDefinition } from "../../types.js";

const COURTLISTENER_API_URL = "https://www.courtlistener.com/api/rest/v3/citation-lookup/";

interface CitationResult {
  citation: string;
  found: boolean;
  case_name?: string;
  court?: string;
  date_filed?: string;
  docket_number?: string;
  courtlistener_url?: string;
  normalized_citation?: string;
}

interface RawCitationMatch {
  case_name?: string;
  court?: string;
  date_filed?: string;
  docket_number?: string;
  absolute_url?: string;
  citation?: string[];
}

interface RawCitationResult {
  citation: string;
  normalized_citations?: string[];
  opinion_cluster?: RawCitationMatch;
  matches?: RawCitationMatch[];
}

const tool: ToolDefinition = {
  name: "validate_citations",
  category: "courtlistener",
  description:
    "Checks whether legal citations (e.g. '410 U.S. 113') refer to real cases using the CourtListener database. Accepts a text block or an array of citation strings. Returns validation status and case metadata for each.",
  tags: [
    "legal",
    "citation",
    "courtlistener",
    "validate",
    "hallucination",
    "verify",
    "case",
    "law",
    "bulk",
  ],
  schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description:
          "A block of text containing citations (e.g. a legal brief). CourtListener will extract and validate all citations found in the text. Use this OR citations[], not both.",
      },
      citations: {
        type: "array",
        description:
          "An array of citation strings to validate (e.g. ['410 U.S. 113', '347 U.S. 483']). Max 250 per request. Use this OR text, not both.",
        items: { type: "string" },
      },
    },
  },
  async execute({ text, citations }) {
    const apiToken = process.env.COURTLISTENER_API_TOKEN;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiToken) {
      headers["Authorization"] = `Token ${apiToken}`;
    }

    // Build request body: either raw text or join citations into a text block
    let body: Record<string, string>;
    if (text && typeof text === "string") {
      body = { text };
    } else if (Array.isArray(citations) && citations.length > 0) {
      if (citations.length > 250) {
        throw new Error(
          `Too many citations: ${citations.length}. CourtListener supports a maximum of 250 per request.`
        );
      }
      // Join into a text block — CourtListener parses citations from free text
      body = { text: (citations as string[]).join("\n") };
    } else {
      throw new Error(
        "Provide either a 'text' string containing citations or a 'citations' array of citation strings."
      );
    }

    const response = await fetch(COURTLISTENER_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      if (response.status === 401) {
        throw new Error(
          "CourtListener API authentication failed. Set COURTLISTENER_API_TOKEN in your environment (get one free at courtlistener.com)."
        );
      }
      if (response.status === 429) {
        throw new Error(
          "CourtListener rate limit hit. Authenticated users get 60 valid citations/minute. Register at courtlistener.com for a free token."
        );
      }
      throw new Error(
        `CourtListener API error ${response.status}: ${errorText.slice(0, 200)}`
      );
    }

    const raw = (await response.json()) as RawCitationResult[];

    const results: CitationResult[] = raw.map((item) => {
      // A citation is "found" if it has an opinion_cluster or at least one match
      const match = item.opinion_cluster ?? item.matches?.[0];
      const found = !!match;

      const result: CitationResult = {
        citation: item.citation,
        found,
      };

      if (item.normalized_citations?.length) {
        result.normalized_citation = item.normalized_citations[0];
      }

      if (match) {
        if (match.case_name) result.case_name = match.case_name;
        if (match.court) result.court = match.court;
        if (match.date_filed) result.date_filed = match.date_filed;
        if (match.docket_number) result.docket_number = match.docket_number;
        if (match.absolute_url) {
          result.courtlistener_url = `https://www.courtlistener.com${match.absolute_url}`;
        }
      }

      return result;
    });

    const total = results.length;
    const valid = results.filter((r) => r.found).length;
    const invalid = total - valid;

    return {
      total,
      valid,
      invalid,
      authenticated: !!apiToken,
      results,
    };
  },
};

export default tool;
