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
  name: "list_campaigns",
  category: "google-ads",
  description: "List Google Ads campaigns with status and budget.",
  tags: ["google-ads", "campaigns", "list", "status", "budget"],
  schema: {
    type: "object",
    properties: {
      customer_id: {
        type: "string",
        description: "Google Ads customer ID (digits only). Falls back to GOOGLE_ADS_CUSTOMER_ID env var.",
      },
      status_filter: {
        type: "string",
        description: 'Filter by status: "ENABLED", "PAUSED", or "REMOVED". Defaults to ENABLED and PAUSED.',
      },
    },
    required: [],
  },
  async execute({ customer_id, status_filter }) {
    const headers = await adsHeaders();
    const cid = ((customer_id as string | undefined) ?? process.env.GOOGLE_ADS_CUSTOMER_ID!).replace(/-/g, "");

    const statusClause = status_filter
      ? `AND campaign.status = '${status_filter as string}'`
      : `AND campaign.status IN ('ENABLED','PAUSED')`;

    const res = await fetch(`${BASE_URL}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros FROM campaign WHERE campaign.status != 'REMOVED' ${statusClause} ORDER BY campaign.name LIMIT 100`,
      }),
    });

    if (!res.ok) throw new Error(`Google Ads error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { results?: Array<{ campaign: Record<string, unknown>; campaignBudget?: Record<string, unknown> }> };

    const campaigns = (data.results ?? []).map((r) => ({
      id: r.campaign?.id,
      name: r.campaign?.name,
      status: r.campaign?.status,
      channel_type: r.campaign?.advertisingChannelType,
      daily_budget_usd: r.campaignBudget?.amountMicros
        ? Number(r.campaignBudget.amountMicros) / 1_000_000
        : null,
    }));

    return { campaigns, total: campaigns.length };
  },
};

export default tool;
