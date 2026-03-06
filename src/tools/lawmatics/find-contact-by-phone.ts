import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "find_contact_by_phone",
  category: "lawmatics",
  description: "Look up a Lawmatics contact by phone number.",
  tags: ["lawmatics", "contact", "phone", "lookup", "search", "crm"],
  schema: {
    type: "object",
    properties: {
      phone: {
        type: "string",
        description: "The phone number to search for (e.g. +15551234567 or 5551234567).",
      },
    },
    required: ["phone"],
  },
  async execute({ phone }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;
    const url = `${BASE_URL}/contacts/find_by_phone?phone=${encodeURIComponent(phone as string)}`;

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
