import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "delete_record",
  category: "airtable",
  description: "Delete one or more Airtable records by ID (up to 10 per call).",
  tags: ["airtable", "record", "delete", "remove"],
  schema: {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "Table ID or name.",
      },
      record_id: {
        type: "string",
        description: "Single record ID to delete.",
      },
      record_ids: {
        type: "array",
        description: "Array of record IDs to delete in bulk (max 10). Use this OR record_id.",
      },
      base_id: {
        type: "string",
        description: "Airtable base ID. Falls back to AIRTABLE_BASE_ID env var.",
      },
    },
    required: ["table_id"],
  },
  async execute({ table_id, record_id, record_ids, base_id }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const ids: string[] = record_ids
      ? (record_ids as string[])
      : [record_id as string];

    if (ids.length > 10) throw new Error("Maximum 10 records per delete call.");

    const params = new URLSearchParams();
    for (const id of ids) params.append("records[]", id);

    const url = `${BASE_URL}/${resolvedBase}/${encodeURIComponent(table_id as string)}?${params}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { records: Array<{ id: string; deleted: boolean }> };
    return {
      success: true,
      deleted: data.records.filter((r) => r.deleted).map((r) => r.id),
      count: data.records.length,
    };
  },
};

export default tool;
