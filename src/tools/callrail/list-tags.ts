import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.callrail.com/v3";

function callrailHeaders() {
  return {
    Authorization: `Token token="${process.env.CALLRAIL_API_KEY}"`,
    "Content-Type": "application/json",
  };
}

function accountId() {
  return process.env.CALLRAIL_ACCOUNT_ID!;
}

const tool: ToolDefinition = {
  name: "list_tags",
  category: "callrail",
  description: "List all available CallRail tags for categorizing calls and form submissions.",
  tags: ["callrail", "tags", "list", "categories"],
  schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const res = await fetch(`${BASE_URL}/a/${accountId()}/tags.json`, {
      headers: callrailHeaders(),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { tags: Array<{ id: number; name: string; color: string; company_id: string }> };
    const tags = (data.tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color }));
    return { tags, total: tags.length };
  },
};

export default tool;
