import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return {
    Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "create_draft",
  category: "missive",
  description: "Create an email or SMS draft in Missive, optionally sending immediately.",
  tags: ["missive", "draft", "email", "send", "compose", "reply"],
  schema: {
    type: "object",
    properties: {
      to: {
        type: "array",
        description: "Recipient email addresses.",
      },
      subject: {
        type: "string",
        description: "Email subject line.",
      },
      body: {
        type: "string",
        description: "Message body (plain text or HTML).",
      },
      conversation_id: {
        type: "string",
        description: "Reply to an existing conversation by providing its ID.",
      },
      send: {
        type: "boolean",
        description: "If true, send immediately. If false (default), save as draft.",
      },
      from_field: {
        type: "object",
        description: 'Sender email. e.g. {"address":"lawyer@firm.com","name":"Jane Smith"}.',
      },
    },
    required: ["body"],
  },
  async execute({ to, subject, body, conversation_id, send, from_field }) {
    const draft: Record<string, unknown> = {
      body,
      send: send ?? false,
    };
    if (to) draft.to_fields = (to as string[]).map((addr) => ({ address: addr }));
    if (subject) draft.subject = subject;
    if (from_field) draft.from_field = from_field;

    const payload: Record<string, unknown> = { drafts: draft };
    if (conversation_id) payload.conversation = { id: conversation_id };

    const res = await fetch(`${BASE_URL}/drafts`, {
      method: "POST",
      headers: missiveHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    // 201 with no body on success
    return { success: true, sent: send ?? false };
  },
};

export default tool;
