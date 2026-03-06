import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "list_fb_ads",
  category: "meta-ads",
  description: "List Meta Ads with their status and approval state.",
  tags: ["meta", "facebook", "ads", "list", "creative"],
  schema: {
    type: "object",
    properties: {
      campaign_id: {
        type: "string",
        description: "Filter ads by campaign ID.",
      },
      ad_set_id: {
        type: "string",
        description: "Filter ads by ad set ID.",
      },
      ad_account_id: {
        type: "string",
        description: "Ad account ID. Falls back to META_AD_ACCOUNT_ID env var.",
      },
      limit: {
        type: "number",
        description: "Max ads to return (default 25).",
      },
    },
    required: [],
  },
  async execute({ campaign_id, ad_set_id, ad_account_id, limit }) {
    const token = process.env.META_ACCESS_TOKEN!;

    const params = new URLSearchParams({
      access_token: token,
      fields: "id,name,status,effective_status,campaign_id,adset_id,created_time,updated_time",
      limit: String(Math.min(Number(limit ?? 25), 100)),
      effective_status: JSON.stringify(["ACTIVE", "PAUSED", "PENDING_REVIEW", "DISAPPROVED"]),
    });

    let endpoint: string;
    if (ad_set_id) {
      endpoint = `${GRAPH_URL}/${ad_set_id as string}/ads`;
    } else if (campaign_id) {
      endpoint = `${GRAPH_URL}/${campaign_id as string}/ads`;
    } else {
      const accountId = ((ad_account_id as string | undefined) ?? process.env.META_AD_ACCOUNT_ID!).replace(/^(?!act_)/, "act_");
      endpoint = `${GRAPH_URL}/${accountId}/ads`;
    }

    const res = await fetch(`${endpoint}?${params}`);
    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { data: Array<Record<string, unknown>> };
    const ads = (data.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      effective_status: a.effective_status,
      campaign_id: a.campaign_id,
      adset_id: a.adset_id,
      created_time: a.created_time,
      updated_time: a.updated_time,
    }));

    return { ads, total: ads.length };
  },
};

export default tool;
