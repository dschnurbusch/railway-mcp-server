import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "get_ad_insights",
  category: "meta-ads",
  description: "Fetch Meta Ads performance metrics: impressions, clicks, spend, CPM, CTR, and conversions.",
  tags: ["meta", "facebook", "ads", "insights", "performance", "metrics", "analytics", "reporting"],
  schema: {
    type: "object",
    properties: {
      object_id: {
        type: "string",
        description: "ID of the campaign, ad set, or ad to get insights for. Falls back to META_AD_ACCOUNT_ID for account-level.",
      },
      level: {
        type: "string",
        description: 'Aggregation level: "account", "campaign" (default), "adset", or "ad".',
      },
      start_date: {
        type: "string",
        description: "Start date in YYYY-MM-DD format.",
      },
      end_date: {
        type: "string",
        description: "End date in YYYY-MM-DD format.",
      },
      breakdown: {
        type: "string",
        description: 'Optional breakdown dimension: "age", "gender", "country", "placement", or "device_platform".',
      },
    },
    required: ["start_date", "end_date"],
  },
  async execute({ object_id, level, start_date, end_date, breakdown }) {
    const token = process.env.META_ACCESS_TOKEN!;
    const id = ((object_id as string | undefined) ?? process.env.META_AD_ACCOUNT_ID!).replace(/^(?!act_)/, "act_");

    const params = new URLSearchParams({
      access_token: token,
      fields: "campaign_name,adset_name,ad_name,impressions,clicks,spend,cpm,ctr,actions,action_values",
      level: (level as string | undefined) ?? "campaign",
      time_range: JSON.stringify({ since: start_date, until: end_date }),
      limit: "50",
    });

    if (breakdown) params.set("breakdowns", breakdown as string);

    const res = await fetch(`${GRAPH_URL}/${id}/insights?${params}`);
    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Array<Record<string, unknown>> };

    const rows = (data.data ?? []).map((r) => {
      const actions = r.actions as Array<{ action_type: string; value: string }> | undefined;
      const leads = actions?.find((a) => a.action_type === "lead")?.value;
      const purchases = actions?.find((a) => a.action_type === "purchase")?.value;

      return {
        campaign: r.campaign_name,
        adset: r.adset_name,
        ad: r.ad_name,
        impressions: r.impressions ? Number(r.impressions) : 0,
        clicks: r.clicks ? Number(r.clicks) : 0,
        spend_usd: r.spend ? Number(r.spend) : 0,
        cpm: r.cpm ? Math.round(Number(r.cpm) * 100) / 100 : null,
        ctr_pct: r.ctr ? Math.round(Number(r.ctr) * 100) / 100 : null,
        leads: leads ? Number(leads) : null,
        purchases: purchases ? Number(purchases) : null,
      };
    });

    return { rows, returned: rows.length, start_date, end_date };
  },
};

export default tool;
