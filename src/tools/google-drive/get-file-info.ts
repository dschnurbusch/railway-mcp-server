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
  name: "get_file_info",
  category: "google-drive",
  description: "Get metadata for a Google Drive file: name, type, size, owner, and sharing URL.",
  tags: ["google", "drive", "file", "info", "metadata"],
  schema: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The Google Drive file or folder ID.",
      },
    },
    required: ["file_id"],
  },
  async execute({ file_id }) {
    const drive = getDriveClient();
    const res = await drive.files.get({
      fileId: file_id as string,
      fields: "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,owners,parents,shared",
    });

    const f = res.data;
    return {
      id: f.id,
      name: f.name,
      mime_type: f.mimeType,
      size_bytes: f.size ? Number(f.size) : null,
      created: f.createdTime,
      modified: f.modifiedTime,
      shared: f.shared,
      url: f.webViewLink,
      owners: (f.owners ?? []).map((o) => ({ name: o.displayName, email: o.emailAddress })),
      parents: f.parents,
    };
  },
};

export default tool;
