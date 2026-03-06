import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "upsert_record",
  category: "airtable",
  description: "Update-or-create an Airtable record by matching on one or more fields.",
  tags: ["airtable", "record", "upsert", "sync", "merge", "write"],
  schema: {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "Table ID or name.",
      },
      fields: {
        type: "object",
        description: "Field name-to-value map. Must include the merge field(s).",
      },
      merge_on: {
        type: "array",
        description: 'Field name(s) to match on for upsert (e.g. ["Email"] or ["First Name","Last Name"]).',
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
    required: ["table_id", "fields", "merge_on"],
  },
  async execute({ table_id, fields, merge_on, base_id, typecast }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const body: Record<string, unknown> = {
      records: [{ fields }],
      performUpsert: { fieldsToMergeOn: merge_on },
    };
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

    const data = (await res.json()) as {
      records: Array<{ id: string; fields: unknown }>;
      createdRecords?: string[];
      updatedRecords?: string[];
    };

    const created = data.createdRecords ?? [];
    const updated = data.updatedRecords ?? [];
    const record = data.records[0];

    return {
      success: true,
      action: created.includes(record?.id) ? "created" : "updated",
      record_id: record?.id,
      fields: record?.fields,
    };
  },
};

export default tool;
