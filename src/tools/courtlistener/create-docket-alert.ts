import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return {
    Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "create_docket_alert",
  category: "courtlistener",
  description: "Subscribe to email alerts for new filings on a specific PACER docket.",
  tags: ["courtlistener", "alert", "docket", "monitor", "pacer", "filings"],
  schema: {
    type: "object",
    properties: {
      docket_id: {
        type: "string",
        description: "The CourtListener docket ID to monitor.",
      },
    },
    required: ["docket_id"],
  },
  async execute({ docket_id }) {
    const res = await fetch(`${BASE_URL}/docket-alerts/`, {
      method: "POST",
      headers: clHeaders(),
      body: JSON.stringify({ docket: docket_id }),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return {
      success: true,
      alert_id: data.id,
      docket_id,
      note: "You will receive email notifications when new documents are filed on this docket.",
    };
  },
};

export default tool;
