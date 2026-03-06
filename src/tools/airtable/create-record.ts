import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "create_record",
  category: "airtable",
  description: "Create one or more records in an Airtable table (up to 10 per call).",
  tags: ["airtable", "record", "create", "insert", "write"],
  schema: {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "Table ID or name.",
      },
      fields: {
        type: "object",
        description: "Field name-to-value map for a single record.",
      },
      records: {
        type: "array",
        description: "Array of {fields: {...}} objects for bulk create (max 10). Use this OR fields, not both.",
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
  async execute({ table_id, fields, records, base_id, typecast }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const recordsArray = records
      ? (records as Array<{ fields: Record<string, unknown> }>)
      : [{ fields: fields as Record<string, unknown> }];

    if (recordsArray.length > 10) throw new Error("Maximum 10 records per create call.");

    const body: Record<string, unknown> = { records: recordsArray };
    if (typecast) body.typecast = true;

    const url = `${BASE_URL}/${resolvedBase}/${encodeURIComponent(table_id as string)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { records: Array<{ id: string; createdTime: string; fields: unknown }> };
    return {
      success: true,
      records: data.records.map((r) => ({ id: r.id, created_at: r.createdTime, fields: r.fields })),
      created: data.records.length,
    };
  },
};

export default tool;
