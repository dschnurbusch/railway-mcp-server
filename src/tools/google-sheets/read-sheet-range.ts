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
  name: "read_sheet_range",
  category: "google-sheets",
  description: "Read cell values from a Google Sheet range (A1 notation).",
  tags: ["google", "sheets", "read", "cells", "range", "data"],
  schema: {
    type: "object",
    properties: {
      spreadsheet_id: {
        type: "string",
        description: "The Google Spreadsheet ID.",
      },
      range: {
        type: "string",
        description: "A1 notation range, optionally with sheet name (e.g. 'Sheet1!A1:D10' or 'A1:D10').",
      },
    },
    required: ["spreadsheet_id", "range"],
  },
  async execute({ spreadsheet_id, range }) {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet_id as string,
      range: range as string,
    });

    const values = res.data.values ?? [];
    return {
      range: res.data.range,
      rows: values.length,
      columns: values[0]?.length ?? 0,
      values,
    };
  },
};

export default tool;
