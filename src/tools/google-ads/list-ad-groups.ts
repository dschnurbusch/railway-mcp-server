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
  name: "list_ad_groups",
  category: "google-ads",
  description: "List ad groups under a Google Ads campaign.",
  tags: ["google-ads", "ad-groups", "list", "campaign"],
  schema: {
    type: "object",
    properties: {
      campaign_id: {
        type: "string",
        description: "Filter ad groups by campaign ID.",
      },
      customer_id: {
        type: "string",
        description: "Google Ads customer ID. Falls back to GOOGLE_ADS_CUSTOMER_ID env var.",
      },
    },
    required: [],
  },
  async execute({ campaign_id, customer_id }) {
    const headers = await adsHeaders();
    const cid = ((customer_id as string | undefined) ?? process.env.GOOGLE_ADS_CUSTOMER_ID!).replace(/-/g, "");

    const campaignFilter = campaign_id ? `AND campaign.id = ${campaign_id as string}` : "";

    const res = await fetch(`${BASE_URL}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `SELECT ad_group.id, ad_group.name, ad_group.status, campaign.id, campaign.name FROM ad_group WHERE ad_group.status != 'REMOVED' ${campaignFilter} ORDER BY ad_group.name LIMIT 100`,
      }),
    });

    if (!res.ok) throw new Error(`Google Ads error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { results?: Array<{ adGroup: Record<string, unknown>; campaign: Record<string, unknown> }> };

    const adGroups = (data.results ?? []).map((r) => ({
      id: r.adGroup?.id,
      name: r.adGroup?.name,
      status: r.adGroup?.status,
      campaign_id: r.campaign?.id,
      campaign_name: r.campaign?.name,
    }));

    return { ad_groups: adGroups, total: adGroups.length };
  },
};

export default tool;
