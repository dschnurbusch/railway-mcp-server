import type { ToolDefinition } from "../../types.js";

const GRAPH_URL = "https://graph.facebook.com/v20.0";

const tool: ToolDefinition = {
  name: "create_fb_campaign",
  category: "meta-ads",
  description: "Create a new Meta Ads campaign (always starts PAUSED; enable manually after review).",
  tags: ["meta", "facebook", "ads", "campaign", "create", "new"],
  schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Campaign name.",
      },
      objective: {
        type: "string",
        description: 'Campaign objective: "OUTCOME_LEADS", "OUTCOME_TRAFFIC", "OUTCOME_AWARENESS", "OUTCOME_ENGAGEMENT", "OUTCOME_SALES", or "OUTCOME_APP_PROMOTION".',
      },
      daily_budget_cents: {
        type: "number",
        description: "Daily budget in cents (e.g. 5000 = $50.00). Use this OR lifetime_budget_cents.",
      },
      lifetime_budget_cents: {
        type: "number",
        description: "Lifetime budget in cents. Use this OR daily_budget_cents.",
      },
      ad_account_id: {
        type: "string",
        description: "Ad account ID. Falls back to META_AD_ACCOUNT_ID env var.",
      },
    },
    required: ["name", "objective"],
  },
  async execute({ name, objective, daily_budget_cents, lifetime_budget_cents, ad_account_id }) {
    const token = process.env.META_ACCESS_TOKEN!;
    const accountId = ((ad_account_id as string | undefined) ?? process.env.META_AD_ACCOUNT_ID!).replace(/^(?!act_)/, "act_");

    const body = new URLSearchParams({
      access_token: token,
      name: name as string,
      objective: objective as string,
      status: "PAUSED",
      special_ad_categories: "[]",
    });

    if (daily_budget_cents !== undefined) body.set("daily_budget", String(daily_budget_cents));
    if (lifetime_budget_cents !== undefined) body.set("lifetime_budget", String(lifetime_budget_cents));

    const res = await fetch(`${GRAPH_URL}/${accountId}/campaigns`, {
      method: "POST",
      body,
    });

    if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { id: string };

    return {
      success: true,
      campaign_id: data.id,
      status: "PAUSED",
      note: "Campaign is PAUSED. Enable it in Meta Ads Manager after review.",
    };
  },
};

export default tool;
