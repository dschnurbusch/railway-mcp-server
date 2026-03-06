import type { ToolDefinition } from "../../types.js";

const API_VERSION = "v18";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

async function adsHeaders() {
  // Get a fresh access token via OAuth2 refresh
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
  name: "list_ad_customers",
  category: "google-ads",
  description: "List all Google Ads customer accounts accessible to the configured credentials.",
  tags: ["google-ads", "customers", "accounts", "list", "discover"],
  schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const headers = await adsHeaders();
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;

    const res = await fetch(`${BASE_URL}/customers/${customerId}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code, customer_client.time_zone, customer_client.manager FROM customer_client WHERE customer_client.status = 'ENABLED'`,
      }),
    });

    if (!res.ok) throw new Error(`Google Ads error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { results?: Array<{ customerClient: Record<string, unknown> }> };

    const accounts = (data.results ?? []).map((r) => ({
      id: r.customerClient?.id,
      name: r.customerClient?.descriptiveName,
      currency: r.customerClient?.currencyCode,
      time_zone: r.customerClient?.timeZone,
      is_manager: r.customerClient?.manager,
    }));

    return { accounts, total: accounts.length };
  },
};

export default tool;
