import type { ToolDefinition } from "../../types.js";
import { google } from "googleapis";

function getSheetsClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: "v4", auth });
}

const tool: ToolDefinition = {
  name: "get_spreadsheet_info",
  category: "google-sheets",
  description: "Get metadata for a Google Spreadsheet: title, sheet tab names, and row/column counts.",
  tags: ["google", "sheets", "spreadsheet", "tabs", "schema", "discover"],
  schema: {
    type: "object",
    properties: {
      spreadsheet_id: {
        type: "string",
        description: "The Google Spreadsheet ID (from the URL: /spreadsheets/d/{id}/).",
      },
    },
    required: ["spreadsheet_id"],
  },
  async execute({ spreadsheet_id }) {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheet_id as string,
      fields: "spreadsheetId,properties.title,sheets.properties",
    });

    const data = res.data;
    return {
      spreadsheet_id: data.spreadsheetId,
      title: data.properties?.title,
      sheets: (data.sheets ?? []).map((s) => ({
        sheet_id: s.properties?.sheetId,
        title: s.properties?.title,
        index: s.properties?.index,
        row_count: s.properties?.gridProperties?.rowCount,
        column_count: s.properties?.gridProperties?.columnCount,
      })),
    };
  },
};

export default tool;
