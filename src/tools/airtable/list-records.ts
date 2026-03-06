import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "list_records",
  category: "airtable",
  description: "List records from an Airtable table with optional view, filter, and pagination.",
  tags: ["airtable", "records", "list", "table", "query"],
  schema: {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "Table ID or name (e.g. tblXXXXXXXXXXXXXX or 'Contacts').",
      },
      base_id: {
        type: "string",
        description: "Airtable base ID. Falls back to AIRTABLE_BASE_ID env var.",
      },
      view: {
        type: "string",
        description: "Return records ordered as in this view name or ID.",
      },
      filter_formula: {
        type: "string",
        description: "Airtable formula to filter records (e.g. \"{Status}=\\\"Active\\\"\").",
      },
      max_records: {
        type: "number",
        description: "Maximum total records to return (default 100).",
      },
      offset: {
        type: "string",
        description: "Pagination cursor returned from a previous call.",
      },
    },
    required: ["table_id"],
  },
  async execute({ table_id, base_id, view, filter_formula, max_records, offset }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const params = new URLSearchParams();
    if (view) params.set("view", view as string);
    if (filter_formula) params.set("filterByFormula", filter_formula as string);
    params.set("pageSize", String(Math.min(Number(max_records ?? 100), 100)));
    if (offset) params.set("offset", offset as string);

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
