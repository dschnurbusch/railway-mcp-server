import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return { Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "list_shared_labels",
  category: "missive",
  description: "List all Missive shared labels (used for categorizing conversations by matter type, stage, etc.).",
  tags: ["missive", "labels", "list", "tags", "categories"],
  schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const res = await fetch(`${BASE_URL}/shared_labels`, {
      headers: missiveHeaders(),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { shared_labels: Array<{ id: string; name: string; color: string }> };
    const labels = (data.shared_labels ?? []).map((l) => ({ id: l.id, name: l.name, color: l.color }));
    return { labels, total: labels.length };
  },
};

export default tool;
