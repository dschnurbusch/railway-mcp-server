import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return { Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "list_conversations",
  category: "missive",
  description: "List Missive conversations from a mailbox or label, ordered newest first.",
  tags: ["missive", "conversations", "inbox", "email", "list"],
  schema: {
    type: "object",
    properties: {
      mailbox_id: {
        type: "string",
        description: "Filter by mailbox ID.",
      },
      label_id: {
        type: "string",
        description: "Filter by shared label ID.",
      },
      limit: {
        type: "number",
        description: "Max conversations to return (default 20, max 50).",
      },
      until: {
        type: "string",
        description: "Cursor for pagination — pass the last_activity_at value from the previous page.",
      },
    },
    required: [],
  },
  async execute({ mailbox_id, label_id, limit, until }) {
    const params = new URLSearchParams();
    if (mailbox_id) params.set("mailbox", mailbox_id as string);
    if (label_id) params.set("shared_label", label_id as string);
    if (until) params.set("until", until as string);
    params.set("limit", String(Math.min(Number(limit ?? 20), 50)));

    const res = await fetch(`${BASE_URL}/conversations?${params}`, {
      headers: missiveHeaders(),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { conversations: Array<Record<string, unknown>> };
    const conversations = (data.conversations ?? []).map((c) => ({
      id: c.id,
      subject: c.subject,
      last_activity_at: c.last_activity_at,
      assignee_names: c.assignee_names,
      shared_label_names: c.shared_label_names,
      is_closed: c.is_closed,
      authors: c.authors,
    }));

    const oldest = conversations[conversations.length - 1];
    return {
      conversations,
      returned: conversations.length,
      next_cursor: oldest?.last_activity_at ?? null,
    };
  },
};

export default tool;
