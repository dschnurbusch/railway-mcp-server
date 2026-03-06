import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return { "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY! };
}

const tool: ToolDefinition = {
  name: "list_mail",
  category: "earth-class-mail",
  description: "List incoming physical mail pieces in an Earth Class Mail inbox.",
  tags: ["earth-class-mail", "mail", "list", "pieces", "inbox"],
  schema: {
    type: "object",
    properties: {
      inbox_id: {
        type: "string",
        description: "The inbox ID to list mail for.",
      },
      unread_only: {
        type: "boolean",
        description: "If true, return only unread pieces.",
      },
      page: {
        type: "number",
        description: "Page number (default 1).",
      },
      per_page: {
        type: "number",
        description: "Items per page (default 25, max 50).",
      },
    },
    required: ["inbox_id"],
  },
  async execute({ inbox_id, unread_only, page, per_page }) {
    const params = new URLSearchParams();
    params.set("page", String(page ?? 1));
    params.set("per_page", String(Math.min(Number(per_page ?? 25), 50)));
    if (unread_only) params.append("attributes[]", "unread");

    const res = await fetch(`${BASE_URL}/inboxes/${inbox_id as string}/pieces?${params}`, {
      headers: ecmHeaders(),
    });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as {
      data: Array<Record<string, unknown>>;
      current_page: number;
      last_page: number;
      total: number;
    };

    const pieces = (data.data ?? []).map((p) => ({
      id: p.id,
      received_at: p.received_at,
      sender: p.sender,
      recipient: p.recipient,
      type: p.type,
      is_scanned: p.is_scanned,
      is_read: p.is_read,
      attributes: p.attributes,
    }));

    return { pieces, returned: pieces.length, total: data.total, page: data.current_page, last_page: data.last_page };
  },
};

export default tool;
