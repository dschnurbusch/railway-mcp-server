import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "update_record",
  category: "airtable",
  description: "Partially update one or more Airtable records (PATCH — only provided fields are changed).",
  tags: ["airtable", "record", "update", "patch", "write"],
  schema: {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "Table ID or name.",
      },
      record_id: {
        type: "string",
        description: "Record ID to update (for single-record updates).",
      },
      fields: {
        type: "object",
        description: "Field name-to-value map for a single record update.",
      },
      records: {
        type: "array",
        description: "Array of {id, fields: {...}} objects for bulk update (max 10). Use this OR record_id+fields.",
      },
      base_id: {
        type: "string",
        description: "Airtable base ID. Falls back to AIRTABLE_BASE_ID env var.",
      },
      typecast: {
        type: "boolean",
        description: "Auto-create select options if they don't exist (default false).",
      },
    },
    required: ["table_id"],
  },
  async execute({ table_id, record_id, fields, records, base_id, typecast }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const recordsArray = records
      ? (records as Array<{ id: string; fields: Record<string, unknown> }>)
      : [{ id: record_id as string, fields: fields as Record<string, unknown> }];

    if (recordsArray.length > 10) throw new Error("Maximum 10 records per update call.");

    const body: Record<string, unknown> = { records: recordsArray };
    if (typecast) body.typecast = true;

    const url = `${BASE_URL}/${resolvedBase}/${encodeURIComponent(table_id as string)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { records: Array<{ id: string; fields: unknown }> };
    return {
      success: true,
      records: data.records.map((r) => ({ id: r.id, fields: r.fields })),
      updated: data.records.length,
    };
  },
};

export default tool;
