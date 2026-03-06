import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return { "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY! };
}

const tool: ToolDefinition = {
  name: "forward_mail",
  category: "earth-class-mail",
  description: "Request physical forwarding/shipment of a mail piece to an address.",
  tags: ["earth-class-mail", "forward", "ship", "physical", "mail"],
  schema: {
    type: "object",
    properties: {
      piece_id: {
        type: "string",
        description: "The mail piece ID to forward.",
      },
    },
    required: ["piece_id"],
  },
  async execute({ piece_id }) {
    const res = await fetch(`${BASE_URL}/pieces/${piece_id as string}/ship`, {
      method: "POST",
      headers: ecmHeaders(),
    });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    return { success: true, piece_id, note: "Physical forwarding requested." };
  },
};

export default tool;
