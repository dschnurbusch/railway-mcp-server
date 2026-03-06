import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "find_contact_by_email",
  category: "lawmatics",
  description: "Look up a Lawmatics contact by email address.",
  tags: ["lawmatics", "contact", "email", "lookup", "search", "crm"],
  schema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "The email address to search for.",
      },
    },
    required: ["email"],
  },
  async execute({ email }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;
    const url = `${BASE_URL}/contacts/find_by_email?email=${encodeURIComponent(email as string)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 404) return { found: false, contact: null };
    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return { found: true, contact: data };
  },
};

export default tool;
