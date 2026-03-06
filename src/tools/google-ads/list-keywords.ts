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
  name: "list_keywords",
  category: "google-ads",
  description: "List keywords in a Google Ads account or ad group with match type and status.",
  tags: ["google-ads", "keywords", "list", "ad-group"],
  schema: {
    type: "object",
    properties: {
      ad_group_id: {
        type: "string",
        description: "Filter keywords by ad group ID.",
      },
      campaign_id: {
        type: "string",
        description: "Filter keywords by campaign ID.",
      },
      customer_id: {
        type: "string",
        description: "Google Ads customer ID. Falls back to GOOGLE_ADS_CUSTOMER_ID env var.",
      },
    },
    required: [],
  },
  async execute({ ad_group_id, campaign_id, customer_id }) {
    const headers = await adsHeaders();
    const cid = ((customer_id as string | undefined) ?? process.env.GOOGLE_ADS_CUSTOMER_ID!).replace(/-/g, "");

    const filters: string[] = ["ad_group_criterion.type = 'KEYWORD'", "ad_group_criterion.status != 'REMOVED'"];
    if (ad_group_id) filters.push(`ad_group.id = ${ad_group_id as string}`);
    if (campaign_id) filters.push(`campaign.id = ${campaign_id as string}`);

    const res = await fetch(`${BASE_URL}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.criterion_id, ad_group.id, ad_group.name, campaign.name FROM ad_group_criterion WHERE ${filters.join(" AND ")} LIMIT 100`,
      }),
    });

    if (!res.ok) throw new Error(`Google Ads error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { results?: Array<{ adGroupCriterion: Record<string, unknown>; adGroup: Record<string, unknown>; campaign: Record<string, unknown> }> };

    const keywords = (data.results ?? []).map((r) => {
      const kw = r.adGroupCriterion?.keyword as Record<string, unknown> | undefined;
      return {
        criterion_id: r.adGroupCriterion?.criterionId,
        text: kw?.text,
        match_type: kw?.matchType,
        status: r.adGroupCriterion?.status,
        ad_group_id: r.adGroup?.id,
        ad_group_name: r.adGroup?.name,
        campaign_name: r.campaign?.name,
      };
    });

    return { keywords, total: keywords.length };
  },
};

export default tool;
