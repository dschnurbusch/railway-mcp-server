import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.earthclassmail.com/v1";

function ecmHeaders() {
  return { "x-api-key": process.env.EARTH_CLASS_MAIL_API_KEY! };
}

const tool: ToolDefinition = {
  name: "list_inboxes",
  category: "earth-class-mail",
  description: "List all Earth Class Mail inboxes (virtual mailboxes) for the account.",
  tags: ["earth-class-mail", "mailbox", "inbox", "list", "virtual-mail"],
  schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const res = await fetch(`${BASE_URL}/inboxes`, { headers: ecmHeaders() });
    if (!res.ok) throw new Error(`Earth Class Mail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Array<Record<string, unknown>> };
    const inboxes = (data.data ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      address: i.address,
      status: i.status,
      piece_count: i.piece_count,
    }));

    return { inboxes, total: inboxes.length };
  },
};

export default tool;
