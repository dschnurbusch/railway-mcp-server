import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "search_records",
  category: "airtable",
  description: "Search Airtable records using an Airtable formula filter expression.",
  tags: ["airtable", "records", "search", "filter", "query", "formula"],
  schema: {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "Table ID or name.",
      },
      filter_formula: {
        type: "string",
        description: 'Airtable filter formula (e.g. \'{Email}="jane@example.com"\', \'SEARCH("keyword",{Notes})\').',
      },
      base_id: {
        type: "string",
        description: "Airtable base ID. Falls back to AIRTABLE_BASE_ID env var.",
      },
      max_records: {
        type: "number",
        description: "Maximum records to return (default 50, max 100).",
      },
    },
    required: ["table_id", "filter_formula"],
  },
  async execute({ table_id, filter_formula, base_id, max_records }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const params = new URLSearchParams();
    params.set("filterByFormula", filter_formula as string);
    params.set("pageSize", String(Math.min(Number(max_records ?? 50), 100)));

    const url = `${BASE_URL}/${resolvedBase}/${encodeURIComponent(table_id as string)}?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { records: unknown[]; offset?: string };
    return {
      records: data.records,
      returned: data.records.length,
      next_offset: data.offset ?? null,
    };
  },
};

export default tool;
