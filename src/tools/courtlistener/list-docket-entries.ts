import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "list_docket_entries",
  category: "courtlistener",
  description: "List filings/entries on a PACER docket in order (most recent first).",
  tags: ["courtlistener", "docket", "entries", "filings", "pacer", "recap"],
  schema: {
    type: "object",
    properties: {
      docket_id: {
        type: "string",
        description: "The CourtListener docket ID.",
      },
      limit: {
        type: "number",
        description: "Max entries to return (default 25).",
      },
    },
    required: ["docket_id"],
  },
  async execute({ docket_id, limit }) {
    const params = new URLSearchParams();
    params.set("docket", docket_id as string);
    params.set("order_by", "-entry_number");
    params.set("limit", String(Math.min(Number(limit ?? 25), 100)));

    const res = await fetch(`${BASE_URL}/docket-entries/?${params}`, {
      headers: clHeaders(),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { count: number; results: Array<Record<string, unknown>> };
    const entries = (data.results ?? []).map((e) => ({
      id: e.id,
      entry_number: e.entry_number,
      date_filed: e.date_filed,
      description: typeof e.description === "string" ? e.description.slice(0, 500) : e.description,
      document_count: Array.isArray(e.recap_documents) ? e.recap_documents.length : 0,
    }));

    return { total: data.count, returned: entries.length, entries };
  },
};

export default tool;
