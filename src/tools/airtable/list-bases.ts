import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "list_airtable_bases",
  category: "airtable",
  description: "List all Airtable bases accessible to the configured API token.",
  tags: ["airtable", "bases", "discover", "list", "schema"],
  schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const token = process.env.AIRTABLE_API_TOKEN;

    const res = await fetch(`${BASE_URL}/meta/bases`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { bases: Array<{ id: string; name: string; permissionLevel: string }> };
    const bases = (data.bases ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      permission_level: b.permissionLevel,
    }));

    return { bases, total: bases.length };
  },
};

export default tool;
