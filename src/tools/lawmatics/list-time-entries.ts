import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "list_time_entries",
  category: "lawmatics",
  description: "List billable time entries in Lawmatics, optionally filtered by matter.",
  tags: ["lawmatics", "time", "billing", "hours", "list", "crm"],
  schema: {
    type: "object",
    properties: {
      matter_id: {
        type: "string",
        description: "Filter time entries by matter ID.",
      },
      page: {
        type: "number",
        description: "Page number for pagination (default 1).",
      },
      per_page: {
        type: "number",
        description: "Results per page (default 25, max 100).",
      },
    },
    required: [],
  },
  async execute({ matter_id, page, per_page }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const params = new URLSearchParams();
    if (matter_id) params.set("matter_id", matter_id as string);
    params.set("page", String(page ?? 1));
    params.set("per_page", String(Math.min(Number(per_page ?? 25), 100)));

    const res = await fetch(`${BASE_URL}/time_entries?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return data;
  },
};

export default tool;
