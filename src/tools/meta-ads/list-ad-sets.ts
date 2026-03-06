import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "list_ad_sets",
  category: "meta-ads",
  description: "List Meta Ads ad sets under a campaign or ad account.",
  tags: ["meta", "facebook", "ads", "ad-sets", "list"],
  schema: {
    type: "object",
    properties: {
      campaign_id: {
        type: "string",
        description: "Filter ad sets by campaign ID.",
      },
      ad_account_id: {
        type: "string",
        description: "Ad account ID. Falls back to META_AD_ACCOUNT_ID env var.",
      },
      limit: {
        type: "number",
        description: "Max ad sets to return (default 25).",
      },
    },
    required: [],
  },
  async execute({ campaign_id, ad_account_id, limit }) {
    const token = process.env.META_ACCESS_TOKEN!;
    const accountId = ((ad_account_id as string | undefined) ?? process.env.META_AD_ACCOUNT_ID!).replace(/^(?!act_)/, "act_");

    const params = new URLSearchParams({
      access_token: token,
      fields: "id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,start_time,end_time",
      limit: String(Math.min(Number(limit ?? 25), 100)),
      effective_status: JSON.stringify(["ACTIVE", "PAUSED"]),
    });

    const endpoint = campaign_id
      ? `${GRAPH_URL}/${campaign_id as string}/adsets`
      : `${GRAPH_URL}/${accountId}/adsets`;

    const res = await fetch(`${endpoint}?${params}`);
    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Array<Record<string, unknown>> };
    const adSets = (data.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      campaign_id: s.campaign_id,
      daily_budget_usd: s.daily_budget ? Number(s.daily_budget) / 100 : null,
      lifetime_budget_usd: s.lifetime_budget ? Number(s.lifetime_budget) / 100 : null,
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    return { ad_sets: adSets, total: adSets.length };
  },
};

export default tool;
