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
  name: "list_sitemaps",
  category: "google-search-console",
  description: "List submitted sitemaps for a Google Search Console property and their status.",
  tags: ["google", "search-console", "seo", "sitemap", "list"],
  schema: {
    type: "object",
    properties: {
      site_url: {
        type: "string",
        description: "The verified site URL.",
      },
    },
    required: ["site_url"],
  },
  async execute({ site_url }) {
    const webmasters = getWebmastersClient();
    const res = await webmasters.sitemaps.list({ siteUrl: site_url as string });

    const sitemaps = (res.data.sitemap ?? []).map((s) => ({
      path: s.path,
      last_submitted: s.lastSubmitted,
      last_downloaded: s.lastDownloaded,
      is_pending: s.isPending,
      is_sitemaps_index: s.isSitemapsIndex,
      warnings: s.warnings,
      errors: s.errors,
    }));

    return { sitemaps, total: sitemaps.length };
  },
};

export default tool;
