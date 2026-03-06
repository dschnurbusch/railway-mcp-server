import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

interface AirtableField {
  id: string;
  name: string;
  type: string;
}

interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: AirtableField[];
}

const tool: ToolDefinition = {
  name: "list_airtable_tables",
  category: "airtable",
  description: "List tables and their field schemas for an Airtable base.",
  tags: ["airtable", "tables", "schema", "fields", "discover"],
  schema: {
    type: "object",
    properties: {
      base_id: {
        type: "string",
        description: "Airtable base ID (e.g. appXXXXXXXXXXXXXX). Falls back to AIRTABLE_BASE_ID env var.",
      },
    },
    required: [],
  },
  async execute({ base_id }) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const resolvedBase = (base_id as string | undefined) ?? process.env.AIRTABLE_BASE_ID;
    if (!resolvedBase) throw new Error("base_id is required (or set AIRTABLE_BASE_ID).");

    const res = await fetch(`${BASE_URL}/meta/bases/${resolvedBase}/tables`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { tables: AirtableTable[] };
    const tables = (data.tables ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      primary_field_id: t.primaryFieldId,
      fields: t.fields.map((f) => ({ id: f.id, name: f.name, type: f.type })),
    }));

    return { base_id: resolvedBase, tables, total: tables.length };
  },
};

export default tool;
