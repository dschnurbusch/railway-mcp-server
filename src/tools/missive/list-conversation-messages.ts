import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return { Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "list_conversation_messages",
  category: "missive",
  description: "List all messages in a Missive conversation thread.",
  tags: ["missive", "messages", "conversation", "email", "thread", "list"],
  schema: {
    type: "object",
    properties: {
      conversation_id: {
        type: "string",
        description: "The Missive conversation ID.",
      },
    },
    required: ["conversation_id"],
  },
  async execute({ conversation_id }) {
    const res = await fetch(`${BASE_URL}/conversations/${conversation_id as string}/messages`, {
      headers: missiveHeaders(),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { messages: Array<Record<string, unknown>> };
    const messages = (data.messages ?? []).map((m) => ({
      id: m.id,
      created_at: m.created_at,
      type: m.type,
      from_field: m.from_field,
      to_fields: m.to_fields,
      subject: m.subject,
      preview: m.preview,
      body: typeof m.body === "string" ? m.body.slice(0, 2000) : m.body,
      attachments: m.attachments,
    }));

    return { messages, total: messages.length };
  },
};

export default tool;
