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
  name: "create_folder",
  category: "google-drive",
  description: "Create a new folder in Google Drive, optionally inside a parent folder.",
  tags: ["google", "drive", "folder", "create", "organize"],
  schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the new folder.",
      },
      parent_folder_id: {
        type: "string",
        description: "ID of the parent folder. Defaults to the root of My Drive.",
      },
    },
    required: ["name"],
  },
  async execute({ name, parent_folder_id }) {
    const drive = getDriveClient();
    const metadata: Record<string, unknown> = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parent_folder_id) metadata.parents = [parent_folder_id];

    const res = await drive.files.create({
      requestBody: metadata,
      fields: "id,name,webViewLink",
    });

    return {
      success: true,
      folder_id: res.data.id,
      name: res.data.name,
      url: res.data.webViewLink,
    };
  },
};

export default tool;
