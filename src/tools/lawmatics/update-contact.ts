import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "update_contact",
  category: "lawmatics",
  description: "Update fields on an existing Lawmatics contact.",
  tags: ["lawmatics", "contact", "update", "edit", "crm"],
  schema: {
    type: "object",
    properties: {
      contact_id: {
        type: "string",
        description: "The Lawmatics contact ID to update.",
      },
      first_name: { type: "string", description: "Updated first name." },
      last_name: { type: "string", description: "Updated last name." },
      email: { type: "string", description: "Updated email address." },
      phone: { type: "string", description: "Updated phone number." },
      address: { type: "string", description: "Updated street address." },
      city: { type: "string", description: "Updated city." },
      state: { type: "string", description: "Updated state." },
      zip: { type: "string", description: "Updated ZIP code." },
      notes: { type: "string", description: "Updated internal notes." },
    },
    required: ["contact_id"],
  },
  async execute({ contact_id, first_name, last_name, email, phone, address, city, state, zip, notes }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const body: Record<string, unknown> = {};
    if (first_name !== undefined) body.first_name = first_name;
    if (last_name !== undefined) body.last_name = last_name;
    if (email !== undefined) body.email = email;
    if (phone !== undefined) body.phone = phone;
    if (address !== undefined) body.address = address;
    if (city !== undefined) body.city = city;
    if (state !== undefined) body.state = state;
    if (zip !== undefined) body.zip = zip;
    if (notes !== undefined) body.notes = notes;

    const res = await fetch(`${BASE_URL}/contacts/${contact_id as string}`, {
      method: "PUT",
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
