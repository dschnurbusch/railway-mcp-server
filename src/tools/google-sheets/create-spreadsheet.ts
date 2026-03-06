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
  name: "create_spreadsheet",
  category: "google-sheets",
  description: "Create a new Google Spreadsheet with a given title and optional sheet tab names.",
  tags: ["google", "sheets", "create", "new", "spreadsheet"],
  schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the new spreadsheet.",
      },
      sheet_names: {
        type: "array",
        description: 'Optional list of tab names to create (e.g. ["Q1","Q2","Q3"]). Defaults to a single "Sheet1".',
      },
    },
    required: ["title"],
  },
  async execute({ title, sheet_names }) {
    const sheets = getSheetsClient();
    const sheetList = sheet_names as string[] | undefined;

    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: title as string },
        sheets: sheetList?.map((name) => ({ properties: { title: name } })),
      },
    });

    return {
      success: true,
      spreadsheet_id: res.data.spreadsheetId,
      title: res.data.properties?.title,
      url: res.data.spreadsheetUrl,
      sheets: (res.data.sheets ?? []).map((s) => ({
        sheet_id: s.properties?.sheetId,
        title: s.properties?.title,
      })),
    };
  },
};

export default tool;
