import type { ToolDefinition } from "../../types.js";

const API_VERSION = "v18";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

async function adsHeaders() {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token refresh failed: ${await tokenRes.text()}`);
  const token = (await tokenRes.json()) as { access_token: string };
  return {
    Authorization: `Bearer ${token.access_token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "query_ad_performance",
  category: "google-ads",
  description: "Run a GAQL query against Google Ads to get performance metrics (impressions, clicks, cost, conversions) for campaigns, ad groups, or keywords.",
  tags: ["google-ads", "performance", "metrics", "gaql", "reporting", "analytics"],
  schema: {
    type: "object",
    properties: {
      customer_id: {
        type: "string",
        description: "Google Ads customer ID. Falls back to GOOGLE_ADS_CUSTOMER_ID env var.",
      },
      start_date: {
        type: "string",
        description: "Start date in YYYY-MM-DD format.",
      },
      end_date: {
        type: "string",
        description: "End date in YYYY-MM-DD format.",
      },
      level: {
        type: "string",
        description: 'Reporting level: "campaign" (default), "ad_group", or "keyword".',
      },
      campaign_id: {
        type: "string",
        description: "Filter metrics to a specific campaign ID.",
      },
    },
    required: ["start_date", "end_date"],
  },
  async execute({ customer_id, start_date, level, end_date, campaign_id }) {
    const headers = await adsHeaders();
    const cid = ((customer_id as string | undefined) ?? process.env.GOOGLE_ADS_CUSTOMER_ID!).replace(/-/g, "");

    const lvl = (level as string | undefined) ?? "campaign";
    const campaignFilter = campaign_id ? `AND campaign.id = ${campaign_id as string}` : "";

    let query: string;
    if (lvl === "ad_group") {
      query = `SELECT campaign.id, campaign.name, ad_group.id, ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM ad_group WHERE segments.date BETWEEN '${start_date as string}' AND '${end_date as string}' ${campaignFilter} ORDER BY metrics.cost_micros DESC LIMIT 50`;
    } else if (lvl === "keyword") {
      query = `SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM keyword_view WHERE segments.date BETWEEN '${start_date as string}' AND '${end_date as string}' ${campaignFilter} ORDER BY metrics.cost_micros DESC LIMIT 50`;
    } else {
      query = `SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc FROM campaign WHERE segments.date BETWEEN '${start_date as string}' AND '${end_date as string}' AND campaign.status != 'REMOVED' ${campaignFilter} ORDER BY metrics.cost_micros DESC LIMIT 50`;
    }

    const res = await fetch(`${BASE_URL}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });

    if (!res.ok) throw new Error(`Google Ads error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { results?: Array<Record<string, unknown>> };

    const rows = (data.results ?? []).map((r) => {
      const metrics = r.metrics as Record<string, unknown> | undefined;
      const campaign = r.campaign as Record<string, unknown> | undefined;
      const adGroup = r.adGroup as Record<string, unknown> | undefined;
      const criterion = r.adGroupCriterion as Record<string, unknown> | undefined;

      return {
        campaign_id: campaign?.id,
        campaign_name: campaign?.name,
        campaign_status: campaign?.status,
        ad_group_name: adGroup?.name,
        keyword: criterion ? (criterion.keyword as Record<string, unknown>)?.text : undefined,
        match_type: criterion ? (criterion.keyword as Record<string, unknown>)?.matchType : undefined,
        impressions: metrics?.impressions,
        clicks: metrics?.clicks,
        cost_usd: metrics?.costMicros ? Number(metrics.costMicros) / 1_000_000 : null,
        conversions: metrics?.conversions,
        ctr_pct: metrics?.ctr ? Math.round(Number(metrics.ctr) * 10000) / 100 : null,
        avg_cpc_usd: metrics?.averageCpc ? Number(metrics.averageCpc) / 1_000_000 : null,
      };
    });

    return { rows, returned: rows.length, level: lvl, start_date, end_date };
  },
};

export default tool;
