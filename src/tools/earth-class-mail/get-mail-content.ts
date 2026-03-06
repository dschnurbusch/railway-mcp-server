import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return { "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY! };
}

const tool: ToolDefinition = {
  name: "get_mail_content",
  category: "earth-class-mail",
  description: "Retrieve the scanned PDF content (base64) for an Earth Class Mail piece that has been opened and scanned.",
  tags: ["earth-class-mail", "scan", "content", "pdf", "read"],
  schema: {
    type: "object",
    properties: {
      piece_id: {
        type: "string",
        description: "The mail piece ID. The piece must already be scanned.",
      },
    },
    required: ["piece_id"],
  },
  async execute({ piece_id }) {
    const res = await fetch(`${BASE_URL}/pieces/${piece_id as string}/media`, {
      headers: ecmHeaders(),
    });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Record<string, unknown> };
    const m = data.data ?? data;
    return {
      piece_id,
      content_type: m.content_type,
      filename: m.filename,
      // Return metadata only — base64 content can be large; client can request separately if needed
      size_bytes: m.size,
      scan_url: m.url,
      note: "Use scan_url to download the PDF directly.",
    };
  },
};

export default tool;
