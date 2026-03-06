import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return {
    "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY!,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "email_scan",
  category: "earth-class-mail",
  description: "Email a scanned mail piece to one or more email addresses.",
  tags: ["earth-class-mail", "email", "scan", "forward", "send"],
  schema: {
    type: "object",
    properties: {
      scan_id: {
        type: "string",
        description: "The scan ID for the piece.",
      },
      emails: {
        type: "array",
        description: "List of email addresses to send the scan to.",
      },
      comment: {
        type: "string",
        description: "Optional comment to include with the emailed scan.",
      },
    },
    required: ["scan_id", "emails"],
  },
  async execute({ scan_id, emails, comment }) {
    const body: Record<string, unknown> = { emails };
    if (comment) body.comment = comment;

    const res = await fetch(`${BASE_URL}/scans/${scan_id as string}/email`, {
      method: "POST",
      headers: ecmHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    return { success: true, scan_id, sent_to: emails };
  },
};

export default tool;
