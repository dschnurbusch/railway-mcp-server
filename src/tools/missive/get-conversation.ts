import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return { Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "get_conversation",
  category: "missive",
  description: "Fetch a specific Missive conversation by ID.",
  tags: ["missive", "conversation", "get", "email", "thread"],
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
    const res = await fetch(`${BASE_URL}/conversations/${conversation_id as string}`, {
      headers: missiveHeaders(),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { conversations: Record<string, unknown> };
    return data.conversations ?? data;
  },
};

export default tool;
