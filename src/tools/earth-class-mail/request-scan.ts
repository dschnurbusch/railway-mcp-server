import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return { "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY! };
}

const tool: ToolDefinition = {
  name: "request_scan",
  category: "earth-class-mail",
  description: "Request that an Earth Class Mail piece be opened and scanned so its contents become available.",
  tags: ["earth-class-mail", "scan", "request", "open", "mail"],
  schema: {
    type: "object",
    properties: {
      piece_id: {
        type: "string",
        description: "The mail piece ID to scan.",
      },
    },
    required: ["piece_id"],
  },
  async execute({ piece_id }) {
    const res = await fetch(`${BASE_URL}/pieces/${piece_id as string}/scan`, {
      method: "POST",
      headers: ecmHeaders(),
    });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    return { success: true, piece_id, note: "Scan requested. Use get_mail_content once the scan is complete." };
  },
};

export default tool;
