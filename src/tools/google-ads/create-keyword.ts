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
  name: "create_keyword",
  category: "google-ads",
  description: "Add a keyword to a Google Ads ad group.",
  tags: ["google-ads", "keyword", "create", "add", "ad-group"],
  schema: {
    type: "object",
    properties: {
      ad_group_id: {
        type: "string",
        description: "The ad group ID to add the keyword to.",
      },
      keyword_text: {
        type: "string",
        description: "The keyword text (e.g. 'personal injury lawyer').",
      },
      match_type: {
        type: "string",
        description: 'Match type: "BROAD", "PHRASE", or "EXACT" (default BROAD).',
      },
      customer_id: {
        type: "string",
        description: "Google Ads customer ID. Falls back to GOOGLE_ADS_CUSTOMER_ID env var.",
      },
      max_cpc_usd: {
        type: "number",
        description: "Optional max CPC bid in USD.",
      },
    },
    required: ["ad_group_id", "keyword_text"],
  },
  async execute({ ad_group_id, keyword_text, match_type, customer_id, max_cpc_usd }) {
    const headers = await adsHeaders();
    const cid = ((customer_id as string | undefined) ?? process.env.GOOGLE_ADS_CUSTOMER_ID!).replace(/-/g, "");
    const adGroupResourceName = `customers/${cid}/adGroups/${ad_group_id as string}`;

    const criterion: Record<string, unknown> = {
      adGroup: adGroupResourceName,
      status: "ENABLED",
      keyword: {
        text: keyword_text,
        matchType: (match_type as string | undefined) ?? "BROAD",
      },
    };

    if (max_cpc_usd !== undefined) {
      criterion.cpcBidMicros = String(Math.round(Number(max_cpc_usd) * 1_000_000));
    }

    const res = await fetch(`${BASE_URL}/customers/${cid}/adGroupCriteria:mutate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        operations: [{ create: criterion }],
      }),
    });

    if (!res.ok) throw new Error(`Google Ads error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { results: Array<{ resourceName: string }> };

    return {
      success: true,
      resource_name: data.results[0]?.resourceName,
      keyword: keyword_text,
      match_type: (match_type as string | undefined) ?? "BROAD",
    };
  },
};

export default tool;
