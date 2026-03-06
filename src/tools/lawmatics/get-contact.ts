import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "get_contact",
  category: "lawmatics",
  description: "Fetch a Lawmatics contact by ID.",
  tags: ["lawmatics", "contact", "get", "fetch", "crm"],
  schema: {
    type: "object",
    properties: {
      contact_id: {
        type: "string",
        description: "The Lawmatics contact ID.",
      },
    },
    required: ["contact_id"],
  },
  async execute({ contact_id }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;
    const res = await fetch(`${BASE_URL}/contacts/${contact_id as string}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return data;
  },
};

export default tool;
