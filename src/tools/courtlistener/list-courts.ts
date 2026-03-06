import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "list_courts",
  category: "courtlistener",
  description: "List available courts and their abbreviations for use in case searches.",
  tags: ["courtlistener", "courts", "jurisdictions", "list", "discover"],
  schema: {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "Filter courts by name (e.g. 'texas', 'ninth circuit', 'supreme').",
      },
      jurisdiction: {
        type: "string",
        description: 'Filter by jurisdiction type: "F" (federal), "FD" (federal district), "FB" (federal bankruptcy), "S" (state).',
      },
    },
    required: [],
  },
  async execute({ search, jurisdiction }) {
    const params = new URLSearchParams();
    if (search) params.set("full_name", search as string);
    if (jurisdiction) params.set("jurisdiction", jurisdiction as string);
    params.set("limit", "50");

    const res = await fetch(`${BASE_URL}/courts/?${params}`, {
      headers: clHeaders(),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { count: number; results: Array<{ id: string; full_name: string; jurisdiction: string; in_use: boolean }> };
    const courts = (data.results ?? [])
      .filter((c) => c.in_use)
      .map((c) => ({
        id: c.id,
        name: c.full_name,
        jurisdiction: c.jurisdiction,
      }));

    return { courts, returned: courts.length, total: data.count };
  },
};

export default tool;
