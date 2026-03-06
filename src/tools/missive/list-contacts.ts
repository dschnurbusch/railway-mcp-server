import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return { Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "list_missive_contacts",
  category: "missive",
  description: "Search Missive contacts by name or email.",
  tags: ["missive", "contacts", "search", "list", "clients"],
  schema: {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "Name or email to search for.",
      },
      limit: {
        type: "number",
        description: "Max results (default 25, max 200).",
      },
    },
    required: [],
  },
  async execute({ search, limit }) {
    const params = new URLSearchParams();
    if (search) params.set("search", search as string);
    params.set("limit", String(Math.min(Number(limit ?? 25), 200)));

    const res = await fetch(`${BASE_URL}/contacts?${params}`, {
      headers: missiveHeaders(),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { contacts: Array<Record<string, unknown>> };
    return { contacts: data.contacts ?? [], total: (data.contacts ?? []).length };
  },
};

export default tool;
