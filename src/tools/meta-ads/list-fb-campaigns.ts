import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "list_fb_campaigns",
  category: "meta-ads",
  description: "List Meta Ads campaigns for an ad account with status and spend.",
  tags: ["meta", "facebook", "ads", "campaigns", "list"],
  schema: {
    type: "object",
    properties: {
      ad_account_id: {
        type: "string",
        description: "Ad account ID (e.g. 'act_123456789'). Falls back to META_AD_ACCOUNT_ID env var.",
      },
      status_filter: {
        type: "string",
        description: 'Filter by status: "ACTIVE", "PAUSED", or "ARCHIVED". Defaults to ACTIVE and PAUSED.',
      },
      limit: {
        type: "number",
        description: "Max campaigns to return (default 25).",
      },
    },
    required: [],
  },
  async execute({ ad_account_id, status_filter, limit }) {
    const token = process.env.META_ACCESS_TOKEN!;
    const accountId = ((ad_account_id as string | undefined) ?? process.env.META_AD_ACCOUNT_ID!).replace(/^(?!act_)/, "act_");

    const params = new URLSearchParams({
      access_token: token,
      fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
      limit: String(Math.min(Number(limit ?? 25), 100)),
    });
    if (status_filter) {
      params.set("effective_status", JSON.stringify([status_filter as string]));
    } else {
      params.set("effective_status", JSON.stringify(["ACTIVE", "PAUSED"]));
    }

    const res = await fetch(`${GRAPH_URL}/${accountId}/campaigns?${params}`);
    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Array<Record<string, unknown>> };
    const campaigns = (data.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      daily_budget_usd: c.daily_budget ? Number(c.daily_budget) / 100 : null,
      lifetime_budget_usd: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
      start_time: c.start_time,
      stop_time: c.stop_time,
    }));

    return { campaigns, total: campaigns.length };
  },
};

export default tool;
