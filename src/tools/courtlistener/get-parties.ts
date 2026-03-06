import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "get_parties",
  category: "courtlistener",
  description: "List parties and their attorneys for a PACER docket.",
  tags: ["courtlistener", "parties", "attorneys", "docket", "pacer"],
  schema: {
    type: "object",
    properties: {
      docket_id: {
        type: "string",
        description: "The CourtListener docket ID.",
      },
    },
    required: ["docket_id"],
  },
  async execute({ docket_id }) {
    const params = new URLSearchParams();
    params.set("docket", docket_id as string);
    params.set("limit", "50");

    const res = await fetch(`${BASE_URL}/parties/?${params}`, {
      headers: clHeaders(),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { count: number; results: Array<Record<string, unknown>> };
    const parties = (data.results ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.party_types,
      attorneys: Array.isArray(p.attorneys)
        ? (p.attorneys as Array<Record<string, unknown>>).map((a) => ({
            name: a.name,
            contact_raw: typeof a.contact_raw === "string" ? a.contact_raw.slice(0, 200) : null,
          }))
        : [],
    }));

    return { parties, total: data.count, returned: parties.length };
  },
};

export default tool;
