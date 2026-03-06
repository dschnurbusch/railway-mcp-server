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
  name: "submit_sitemap",
  category: "google-search-console",
  description: "Submit a sitemap URL to Google Search Console for crawling.",
  tags: ["google", "search-console", "seo", "sitemap", "submit"],
  schema: {
    type: "object",
    properties: {
      site_url: {
        type: "string",
        description: "The verified site URL.",
      },
      sitemap_url: {
        type: "string",
        description: "The full URL of the sitemap to submit (e.g. 'https://example.com/sitemap.xml').",
      },
    },
    required: ["site_url", "sitemap_url"],
  },
  async execute({ site_url, sitemap_url }) {
    const webmasters = getWebmastersClient();

    await webmasters.sitemaps.submit({
      siteUrl: site_url as string,
      feedpath: sitemap_url as string,
    });

    return { success: true, sitemap_url, site_url };
  },
};

export default tool;
