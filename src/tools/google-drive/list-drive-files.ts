import type { ToolDefinition } from "../../types.js";
import { google } from "googleapis";

function getDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth });
}

const tool: ToolDefinition = {
  name: "list_drive_files",
  category: "google-drive",
  description: "Search Google Drive files and folders by name, type, or parent folder.",
  tags: ["google", "drive", "files", "search", "list", "folders"],
  schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Name or keyword to search for.",
      },
      mime_type: {
        type: "string",
        description: "Filter by MIME type (e.g. 'application/vnd.google-apps.spreadsheet', 'application/pdf', 'application/vnd.google-apps.folder').",
      },
      parent_folder_id: {
        type: "string",
        description: "Limit results to files inside this folder ID.",
      },
      max_results: {
        type: "number",
        description: "Max files to return (default 20, max 50).",
      },
    },
    required: [],
  },
  async execute({ query, mime_type, parent_folder_id, max_results }) {
    const drive = getDriveClient();

    const conditions: string[] = ["trashed = false"];
    if (query) conditions.push(`name contains '${(query as string).replace(/'/g, "\\'")}'`);
    if (mime_type) conditions.push(`mimeType = '${mime_type as string}'`);
    if (parent_folder_id) conditions.push(`'${parent_folder_id as string}' in parents`);

    const res = await drive.files.list({
      q: conditions.join(" and "),
      pageSize: Math.min(Number(max_results ?? 20), 50),
      fields: "files(id,name,mimeType,size,modifiedTime,webViewLink,parents)",
      orderBy: "modifiedTime desc",
    });

    const files = (res.data.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      mime_type: f.mimeType,
      size_bytes: f.size ? Number(f.size) : null,
      modified: f.modifiedTime,
      url: f.webViewLink,
      parents: f.parents,
    }));

    return { files, returned: files.length };
  },
};

export default tool;
