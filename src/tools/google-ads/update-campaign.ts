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
  name: "update_campaign",
  category: "google-ads",
  description: "Update a Google Ads campaign's name, status, or budget.",
  tags: ["google-ads", "campaign", "update", "status", "budget", "pause", "enable"],
  schema: {
    type: "object",
    properties: {
      campaign_id: {
        type: "string",
        description: "Google Ads campaign ID.",
      },
      name: {
        type: "string",
        description: "New campaign name.",
      },
      status: {
        type: "string",
        description: 'New status: "ENABLED", "PAUSED", or "REMOVED".',
      },
      customer_id: {
        type: "string",
        description: "Google Ads customer ID. Falls back to GOOGLE_ADS_CUSTOMER_ID env var.",
      },
    },
    required: ["campaign_id"],
  },
  async execute({ campaign_id, name, status, customer_id }) {
    const headers = await adsHeaders();
    const cid = ((customer_id as string | undefined) ?? process.env.GOOGLE_ADS_CUSTOMER_ID!).replace(/-/g, "");
    const resourceName = `customers/${cid}/campaigns/${campaign_id as string}`;

    const updateFields: Record<string, unknown> = { resourceName };
    const updateMask: string[] = [];

    if (name !== undefined) { updateFields.name = name; updateMask.push("name"); }
    if (status !== undefined) { updateFields.status = status; updateMask.push("status"); }

    if (updateMask.length === 0) throw new Error("Provide at least one field to update (name or status).");

    const res = await fetch(`${BASE_URL}/customers/${cid}/campaigns:mutate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        operations: [{ update: updateFields, updateMask: updateMask.join(",") }],
      }),
    });

    if (!res.ok) throw new Error(`Google Ads error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { results: Array<{ resourceName: string }> };

    return {
      success: true,
      campaign_resource_name: data.results[0]?.resourceName,
      updated_fields: updateMask,
    };
  },
};

export default tool;
