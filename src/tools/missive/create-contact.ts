import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return {
    Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "create_missive_contact",
  category: "missive",
  description: "Create a new contact in a Missive contact book.",
  tags: ["missive", "contact", "create", "new", "client"],
  schema: {
    type: "object",
    properties: {
      contact_book_id: {
        type: "string",
        description: "The contact book ID to add the contact to.",
      },
      name: {
        type: "string",
        description: "Contact's full name.",
      },
      email: {
        type: "string",
        description: "Contact's email address.",
      },
      phone: {
        type: "string",
        description: "Contact's phone number.",
      },
    },
    required: ["contact_book_id", "name"],
  },
  async execute({ contact_book_id, name, email, phone }) {
    const contact: Record<string, unknown> = { name, contact_book_id };
    if (email) contact.emails = [{ address: email }];
    if (phone) contact.phones = [{ number: phone }];

    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: missiveHeaders(),
      body: JSON.stringify({ contacts: contact }),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    return { success: true };
  },
};

export default tool;
