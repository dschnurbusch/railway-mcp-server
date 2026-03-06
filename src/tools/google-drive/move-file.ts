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
  name: "move_file",
  category: "google-drive",
  description: "Move a Google Drive file or folder to a different parent folder.",
  tags: ["google", "drive", "move", "organize", "folder"],
  schema: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The Google Drive file or folder ID to move.",
      },
      destination_folder_id: {
        type: "string",
        description: "ID of the destination folder.",
      },
    },
    required: ["file_id", "destination_folder_id"],
  },
  async execute({ file_id, destination_folder_id }) {
    const drive = getDriveClient();

    // Fetch current parents
    const meta = await drive.files.get({
      fileId: file_id as string,
      fields: "parents",
    });
    const previousParents = (meta.data.parents ?? []).join(",");

    const res = await drive.files.update({
      fileId: file_id as string,
      addParents: destination_folder_id as string,
      removeParents: previousParents,
      fields: "id,name,parents",
    });

    return {
      success: true,
      file_id: res.data.id,
      name: res.data.name,
      new_parents: res.data.parents,
    };
  },
};

export default tool;
