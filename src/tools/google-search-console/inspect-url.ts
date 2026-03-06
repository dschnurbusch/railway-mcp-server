import type { ToolDefinition } from "../../types.js";
import { google } from "googleapis";

function getSearchConsoleClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.searchconsole({ version: "v1", auth });
}

const tool: ToolDefinition = {
  name: "inspect_url",
  category: "google-search-console",
  description: "Check a URL's indexing status, crawl date, and coverage state in Google Search Console.",
  tags: ["google", "search-console", "seo", "index", "url", "crawl"],
  schema: {
    type: "object",
    properties: {
      site_url: {
        type: "string",
        description: "The verified site URL the page belongs to.",
      },
      page_url: {
        type: "string",
        description: "The full URL of the page to inspect.",
      },
    },
    required: ["site_url", "page_url"],
  },
  async execute({ site_url, page_url }) {
    const sc = getSearchConsoleClient();
    const res = await sc.urlInspection.index.inspect({
      requestBody: {
        siteUrl: site_url as string,
        inspectionUrl: page_url as string,
      },
    });

    const result = res.data.inspectionResult;
    const index = result?.indexStatusResult;
    const mobile = result?.mobileUsabilityResult;

    return {
      url: page_url,
      verdict: index?.verdict,
      coverage_state: index?.coverageState,
      last_crawl: index?.lastCrawlTime,
      crawled_as: index?.crawledAs,
      indexing_state: index?.indexingState,
      page_fetch_state: index?.pageFetchState,
      mobile_usability: mobile?.verdict,
    };
  },
};

export default tool;
