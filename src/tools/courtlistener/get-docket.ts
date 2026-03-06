import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "get_docket",
  category: "courtlistener",
  description: "Fetch metadata for a court docket by docket ID.",
  tags: ["courtlistener", "docket", "case", "pacer", "recap"],
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
    const res = await fetch(`${BASE_URL}/dockets/${docket_id as string}/`, {
      headers: clHeaders(),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const d = (await res.json()) as Record<string, unknown>;
    return {
      id: d.id,
      docket_number: d.docket_number,
      case_name: d.case_name,
      court: d.court,
      date_filed: d.date_filed,
      date_terminated: d.date_terminated,
      cause: d.cause,
      nature_of_suit: d.nature_of_suit,
      jury_demand: d.jury_demand,
      assigned_to_str: d.assigned_to_str,
      referred_to_str: d.referred_to_str,
      pacer_case_id: d.pacer_case_id,
      source: d.source,
    };
  },
};

export default tool;
