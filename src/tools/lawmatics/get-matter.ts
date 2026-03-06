import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "get_matter",
  category: "lawmatics",
  description: "Fetch a Lawmatics matter (case) by ID.",
  tags: ["lawmatics", "matter", "case", "get", "fetch", "crm"],
  schema: {
    type: "object",
    properties: {
      matter_id: {
        type: "string",
        description: "The Lawmatics matter ID.",
      },
    },
    required: ["matter_id"],
  },
  async execute({ matter_id }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;
    const res = await fetch(`${BASE_URL}/matters/${matter_id as string}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return data;
  },
};

export default tool;
