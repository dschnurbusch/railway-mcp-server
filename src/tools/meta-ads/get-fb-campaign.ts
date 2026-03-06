import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "get_fb_campaign",
  category: "meta-ads",
  description: "Get details for a specific Meta Ads campaign by ID.",
  tags: ["meta", "facebook", "ads", "campaign", "get", "details"],
  schema: {
    type: "object",
    properties: {
      campaign_id: {
        type: "string",
        description: "The Meta campaign ID.",
      },
    },
    required: ["campaign_id"],
  },
  async execute({ campaign_id }) {
    const token = process.env.META_ACCESS_TOKEN!;
    const params = new URLSearchParams({
      access_token: token,
      fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,buying_type",
    });

    const res = await fetch(`${GRAPH_URL}/${campaign_id as string}?${params}`);
    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);

    const c = (await res.json()) as Record<string, unknown>;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      buying_type: c.buying_type,
      daily_budget_usd: c.daily_budget ? Number(c.daily_budget) / 100 : null,
      lifetime_budget_usd: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
      start_time: c.start_time,
      stop_time: c.stop_time,
      created_time: c.created_time,
      updated_time: c.updated_time,
    };
  },
};

export default tool;
