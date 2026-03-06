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
  name: "list_search_console_sites",
  category: "google-search-console",
  description: "List all Google Search Console properties (sites) the account has access to.",
  tags: ["google", "search-console", "seo", "sites", "properties", "list"],
  schema: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const webmasters = getWebmastersClient();
    const res = await webmasters.sites.list();

    const sites = (res.data.siteEntry ?? []).map((s) => ({
      url: s.siteUrl,
      permission_level: s.permissionLevel,
    }));

    return { sites, total: sites.length };
  },
};

export default tool;
