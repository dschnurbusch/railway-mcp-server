import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "create_contact",
  category: "lawmatics",
  description: "Create a new contact in Lawmatics.",
  tags: ["lawmatics", "contact", "create", "new", "crm"],
  schema: {
    type: "object",
    properties: {
      first_name: {
        type: "string",
        description: "Contact's first name.",
      },
      last_name: {
        type: "string",
        description: "Contact's last name.",
      },
      email: {
        type: "string",
        description: "Contact's email address.",
      },
      phone: {
        type: "string",
        description: "Contact's phone number.",
      },
      address: {
        type: "string",
        description: "Contact's street address.",
      },
      city: {
        type: "string",
        description: "Contact's city.",
      },
      state: {
        type: "string",
        description: "Contact's state (e.g. CA, TX).",
      },
      zip: {
        type: "string",
        description: "Contact's ZIP code.",
      },
      notes: {
        type: "string",
        description: "Internal notes about the contact.",
      },
    },
    required: ["first_name", "last_name"],
  },
  async execute({ first_name, last_name, email, phone, address, city, state, zip, notes }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const body: Record<string, unknown> = { first_name, last_name };
    if (email) body.email = email;
    if (phone) body.phone = phone;
    if (address) body.address = address;
    if (city) body.city = city;
    if (state) body.state = state;
    if (zip) body.zip = zip;
    if (notes) body.notes = notes;

    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return { success: true, contact: data };
  },
};

export default tool;
