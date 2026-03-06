import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "search_cases",
  category: "courtlistener",
  description: "Search CourtListener for case law opinions, PACER dockets, or court records by keyword or natural language query.",
  tags: ["courtlistener", "search", "cases", "law", "opinions", "dockets", "legal-research"],
  schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query — keywords or natural language (e.g. 'personal injury premises liability slip fall').",
      },
      type: {
        type: "string",
        description: 'Content type to search: "o" = opinions (default), "r" = RECAP/PACER dockets, "d" = dockets, "p" = judges.',
      },
      court: {
        type: "string",
        description: 'Court abbreviation filter (e.g. "scotus", "ca9", "txsd"). See list_courts for options.',
      },
      filed_after: {
        type: "string",
        description: "Filter to cases filed after this date (YYYY-MM-DD).",
      },
      filed_before: {
        type: "string",
        description: "Filter to cases filed before this date (YYYY-MM-DD).",
      },
      order_by: {
        type: "string",
        description: 'Sort order: "score desc" (relevance, default), "dateFiled desc", "citeCount desc".',
      },
    },
    required: ["query"],
  },
  async execute({ query, type, court, filed_after, filed_before, order_by }) {
    const params = new URLSearchParams();
    params.set("q", query as string);
    params.set("type", (type as string | undefined) ?? "o");
    if (court) params.set("court", court as string);
    if (filed_after) params.set("filed_after", filed_after as string);
    if (filed_before) params.set("filed_before", filed_before as string);
    params.set("order_by", (order_by as string | undefined) ?? "score desc");
    params.set("highlight", "on");

    const res = await fetch(`${BASE_URL}/search/?${params}`, {
      headers: clHeaders(),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { count: number; results: Array<Record<string, unknown>> };
    const results = (data.results ?? []).slice(0, 10).map((r) => ({
      id: r.id,
      case_name: r.caseName,
      court: r.court,
      date_filed: r.dateFiled,
      citation: r.citation,
      docket_number: r.docketNumber,
      status: r.status,
      snippet: r.snippet,
      absolute_url: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : null,
      cite_count: r.citeCount,
    }));

    return { total: data.count, returned: results.length, results };
  },
};

export default tool;
