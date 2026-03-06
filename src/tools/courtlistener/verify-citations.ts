import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return {
    Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "verify_citations",
  category: "courtlistener",
  description: "Verify legal citations in a block of text against CourtListener's database. Use this to catch AI-hallucinated case citations before using them in any legal document.",
  tags: ["courtlistener", "citations", "verify", "hallucination", "legal-research", "validate"],
  schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "A block of text containing legal citations to verify (e.g. a memo, brief excerpt, or research summary).",
      },
    },
    required: ["text"],
  },
  async execute({ text }) {
    const res = await fetch(`${BASE_URL}/citations/`, {
      method: "POST",
      headers: clHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Array<{
      citation: string;
      normalized_citations: string[];
      clusters: Array<{ id: number; case_name: string; absolute_url: string }>;
      start_index: number;
      end_index: number;
    }>;

    const results = data.map((item) => ({
      citation: item.citation,
      verified: item.clusters && item.clusters.length > 0,
      matched_cases: (item.clusters ?? []).map((c) => ({
        id: c.id,
        case_name: c.case_name,
        url: `https://www.courtlistener.com${c.absolute_url}`,
      })),
      normalized: item.normalized_citations,
    }));

    const verified = results.filter((r) => r.verified).length;
    const unverified = results.filter((r) => !r.verified).length;

    return {
      total_citations_found: results.length,
      verified,
      unverified,
      warning: unverified > 0 ? `${unverified} citation(s) could not be verified — may be hallucinated or incorrectly formatted.` : null,
      citations: results,
    };
  },
};

export default tool;
