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
  name: "append_sheet_rows",
  category: "google-sheets",
  description: "Append rows to the end of a Google Sheet table.",
  tags: ["google", "sheets", "append", "rows", "insert", "write"],
  schema: {
    type: "object",
    properties: {
      spreadsheet_id: {
        type: "string",
        description: "The Google Spreadsheet ID.",
      },
      range: {
        type: "string",
        description: "Sheet name or range to append after (e.g. 'Sheet1' or 'Sheet1!A:Z').",
      },
      values: {
        type: "array",
        description: "2D array of rows to append. e.g. [[\"Bob\",25],[\"Carol\",31]].",
      },
    },
    required: ["spreadsheet_id", "range", "values"],
  },
  async execute({ spreadsheet_id, range, values }) {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheet_id as string,
      range: range as string,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: values as unknown[][] },
    });

    return {
      success: true,
      updated_range: res.data.updates?.updatedRange,
      appended_rows: res.data.updates?.updatedRows,
    };
  },
};

export default tool;
