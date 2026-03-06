import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "list_ad_accounts",
  category: "meta-ads",
  description: "List all Meta (Facebook/Instagram) ad accounts accessible to the configured access token.",
  tags: ["meta", "facebook", "ads", "accounts", "list", "discover"],
  schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const token = process.env.META_ACCESS_TOKEN!;
    const params = new URLSearchParams({
      access_token: token,
      fields: "id,name,account_status,currency,timezone_name",
    });

    const res = await fetch(`${GRAPH_URL}/me/adaccounts?${params}`);
    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Array<Record<string, unknown>> };
    const accounts = (data.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      status: a.account_status,
      currency: a.currency,
      timezone: a.timezone_name,
    }));

    return { accounts, total: accounts.length };
  },
};

export default tool;
