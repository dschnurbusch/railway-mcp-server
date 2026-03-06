import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return { "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY! };
}

const tool: ToolDefinition = {
  name: "get_mail_piece",
  category: "earth-class-mail",
  description: "Get details for a specific Earth Class Mail piece: sender, recipient, and available actions.",
  tags: ["earth-class-mail", "mail", "piece", "get", "detail"],
  schema: {
    type: "object",
    properties: {
      piece_id: {
        type: "string",
        description: "The mail piece ID.",
      },
    },
    required: ["piece_id"],
  },
  async execute({ piece_id }) {
    const res = await fetch(`${BASE_URL}/pieces/${piece_id as string}`, {
      headers: ecmHeaders(),
    });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Record<string, unknown> };
    const p = data.data ?? data;
    return {
      id: p.id,
      received_at: p.received_at,
      sender: p.sender,
      recipient: p.recipient,
      type: p.type,
      is_scanned: p.is_scanned,
      is_read: p.is_read,
      attributes: p.attributes,
      available_actions: p.available_actions,
    };
  },
};

export default tool;
