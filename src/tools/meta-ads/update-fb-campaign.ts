import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "update_fb_campaign",
  category: "meta-ads",
  description: "Update a Meta Ads campaign's name, status, or budget.",
  tags: ["meta", "facebook", "ads", "campaign", "update", "pause", "enable", "budget"],
  schema: {
    type: "object",
    properties: {
      campaign_id: {
        type: "string",
        description: "The Meta campaign ID.",
      },
      name: {
        type: "string",
        description: "New campaign name.",
      },
      status: {
        type: "string",
        description: 'New status: "ACTIVE", "PAUSED", or "ARCHIVED".',
      },
      daily_budget_cents: {
        type: "number",
        description: "New daily budget in cents.",
      },
    },
    required: ["campaign_id"],
  },
  async execute({ campaign_id, name, status, daily_budget_cents }) {
    const token = process.env.META_ACCESS_TOKEN!;

    const body = new URLSearchParams({ access_token: token });
    if (name !== undefined) body.set("name", name as string);
    if (status !== undefined) body.set("status", status as string);
    if (daily_budget_cents !== undefined) body.set("daily_budget", String(daily_budget_cents));

    const res = await fetch(`${GRAPH_URL}/${campaign_id as string}`, {
      method: "POST",
      body,
    });

    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { success: boolean };

    return { success: data.success, campaign_id };
  },
};

export default tool;
