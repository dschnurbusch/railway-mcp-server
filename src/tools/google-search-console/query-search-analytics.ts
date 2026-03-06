import type { ToolDefinition } from "../../types.js";
import { google } from "googleapis";

function getWebmastersClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.webmasters({ version: "v3", auth });
}

const tool: ToolDefinition = {
  name: "query_search_analytics",
  category: "google-search-console",
  description: "Query Google Search Console for clicks, impressions, CTR, and position broken down by query, page, or date.",
  tags: ["google", "search-console", "seo", "analytics", "clicks", "impressions", "keywords", "position"],
  schema: {
    type: "object",
    properties: {
      site_url: {
        type: "string",
        description: "The verified site URL (e.g. 'https://example.com/' or 'sc-domain:example.com').",
      },
      start_date: {
        type: "string",
        description: "Start date in YYYY-MM-DD format.",
      },
      end_date: {
        type: "string",
        description: "End date in YYYY-MM-DD format.",
      },
      dimensions: {
        type: "array",
        description: 'Dimensions to group by. Options: "query", "page", "country", "device", "date". Default: ["query"].',
      },
      row_limit: {
        type: "number",
        description: "Max rows to return (default 25, max 1000).",
      },
      page_filter: {
        type: "string",
        description: "Filter to a specific page URL (exact match).",
      },
      query_filter: {
        type: "string",
        description: "Filter to queries containing this string.",
      },
    },
    required: ["site_url", "start_date", "end_date"],
  },
  async execute({ site_url, start_date, end_date, dimensions, row_limit, page_filter, query_filter }) {
    const webmasters = getWebmastersClient();

    const dims = (dimensions as string[] | undefined) ?? ["query"];
    const filters = [];
    if (page_filter) {
      filters.push({ dimension: "page", operator: "equals", expression: page_filter as string });
    }
    if (query_filter) {
      filters.push({ dimension: "query", operator: "contains", expression: query_filter as string });
    }

    const res = await webmasters.searchanalytics.query({
      siteUrl: site_url as string,
      requestBody: {
        startDate: start_date as string,
        endDate: end_date as string,
        dimensions: dims,
        rowLimit: Math.min(Number(row_limit ?? 25), 1000),
        dimensionFilterGroups: filters.length > 0 ? [{ filters }] : undefined,
      },
    });

    const rows = (res.data.rows ?? []).map((r) => ({
      keys: r.keys,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr ? Math.round(r.ctr * 10000) / 100 : null, // as percentage
      position: r.position ? Math.round((r.position as number) * 10) / 10 : null,
    }));

    return { rows, returned: rows.length, dimensions: dims };
  },
};

export default tool;
