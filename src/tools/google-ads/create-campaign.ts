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
  name: "create_campaign",
  category: "google-ads",
  description: "Create a new Google Ads campaign (always starts PAUSED; enable manually after review).",
  tags: ["google-ads", "campaign", "create", "new"],
  schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Campaign name.",
      },
      daily_budget_usd: {
        type: "number",
        description: "Daily budget in USD.",
      },
      channel_type: {
        type: "string",
        description: 'Advertising channel: "SEARCH" (default), "DISPLAY", or "PERFORMANCE_MAX".',
      },
      customer_id: {
        type: "string",
        description: "Google Ads customer ID. Falls back to GOOGLE_ADS_CUSTOMER_ID env var.",
      },
      start_date: {
        type: "string",
        description: "Campaign start date in YYYYMMDD format (defaults to today).",
      },
    },
    required: ["name", "daily_budget_usd"],
  },
  async execute({ name, daily_budget_usd, channel_type, customer_id, start_date }) {
    const headers = await adsHeaders();
    const cid = ((customer_id as string | undefined) ?? process.env.GOOGLE_ADS_CUSTOMER_ID!).replace(/-/g, "");
    const budgetMicros = Math.round(Number(daily_budget_usd) * 1_000_000);

    // Step 1: Create budget
    const budgetRes = await fetch(`${BASE_URL}/customers/${cid}/campaignBudgets:mutate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        operations: [{
          create: {
            name: `Budget for ${name as string}`,
            amountMicros: String(budgetMicros),
            deliveryMethod: "STANDARD",
          },
        }],
      }),
    });
    if (!budgetRes.ok) throw new Error(`Budget create error ${budgetRes.status}: ${await budgetRes.text()}`);
    const budgetData = (await budgetRes.json()) as { results: Array<{ resourceName: string }> };
    const budgetResourceName = budgetData.results[0]?.resourceName;

    // Step 2: Create campaign (PAUSED)
    const campaignBody: Record<string, unknown> = {
      name,
      status: "PAUSED",
      advertisingChannelType: (channel_type as string | undefined) ?? "SEARCH",
      campaignBudget: budgetResourceName,
      manualCpc: {},
    };
    if (start_date) campaignBody.startDate = start_date;

    const campaignRes = await fetch(`${BASE_URL}/customers/${cid}/campaigns:mutate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        operations: [{ create: campaignBody }],
      }),
    });
    if (!campaignRes.ok) throw new Error(`Campaign create error ${campaignRes.status}: ${await campaignRes.text()}`);
    const campaignData = (await campaignRes.json()) as { results: Array<{ resourceName: string }> };

    return {
      success: true,
      campaign_resource_name: campaignData.results[0]?.resourceName,
      budget_resource_name: budgetResourceName,
      status: "PAUSED",
      note: "Campaign is PAUSED. Enable it manually in Google Ads after review.",
    };
  },
};

export default tool;
