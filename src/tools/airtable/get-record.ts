import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "get_record",
  category: "airtable",
  description: "Fetch a single Airtable record by ID.",
  tags: ["airtable", "record", "get", "fetch"],
  schema: {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "Table ID or name.",
      },
      record_id: {
        type: "string",
        description: "Airtable record ID (format: recXXXXXXXXXXXXXX).",
      },
      base_id: {
        type: "string",
        description: "Airtable base ID. Falls back to AIRTABLE_BASE_ID env var.",
      },
    },
    required: ["table_id", "record_id"],
  },
  async execute({ table_id, record_id, base_id }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const url = `${BASE_URL}/${resolvedBase}/${encodeURIComponent(table_id as string)}/${record_id as string}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);

    return await res.json();
  },
};

export default tool;
