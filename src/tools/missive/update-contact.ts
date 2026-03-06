import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return {
    Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "update_missive_contact",
  category: "missive",
  description: "Update a Missive contact's name, email, or phone.",
  tags: ["missive", "contact", "update", "edit"],
  schema: {
    type: "object",
    properties: {
      contact_id: {
        type: "string",
        description: "The Missive contact ID to update.",
      },
      name: {
        type: "string",
        description: "Updated full name.",
      },
      email: {
        type: "string",
        description: "Updated email address.",
      },
      phone: {
        type: "string",
        description: "Updated phone number.",
      },
    },
    required: ["contact_id"],
  },
  async execute({ contact_id, name, email, phone }) {
    const contact: Record<string, unknown> = { id: contact_id };
    if (name !== undefined) contact.name = name;
    if (email !== undefined) contact.emails = [{ address: email }];
    if (phone !== undefined) contact.phones = [{ number: phone }];

    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "PATCH",
      headers: missiveHeaders(),
      body: JSON.stringify({ contacts: contact }),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    return { success: true, contact_id };
  },
};

export default tool;
