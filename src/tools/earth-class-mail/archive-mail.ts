import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return { "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY! };
}

const tool: ToolDefinition = {
  name: "archive_mail",
  category: "earth-class-mail",
  description: "Archive a processed Earth Class Mail piece.",
  tags: ["earth-class-mail", "archive", "mail", "processed"],
  schema: {
    type: "object",
    properties: {
      piece_id: {
        type: "string",
        description: "The mail piece ID to archive.",
      },
    },
    required: ["piece_id"],
  },
  async execute({ piece_id }) {
    const res = await fetch(`${BASE_URL}/pieces/${piece_id as string}/archive`, {
      method: "POST",
      headers: ecmHeaders(),
    });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    return { success: true, piece_id };
  },
};

export default tool;
