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
  name: "share_file",
  category: "google-drive",
  description: "Share a Google Drive file or folder with a user or make it publicly viewable.",
  tags: ["google", "drive", "share", "permissions", "access"],
  schema: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The Google Drive file or folder ID.",
      },
      role: {
        type: "string",
        description: 'Permission role: "reader", "commenter", or "writer".',
      },
      email: {
        type: "string",
        description: "Email address of the user to share with. Omit to make the file public.",
      },
    },
    required: ["file_id", "role"],
  },
  async execute({ file_id, role, email }) {
    const drive = getDriveClient();

    const permission: Record<string, string> = {
      role: role as string,
      type: email ? "user" : "anyone",
    };
    if (email) permission.emailAddress = email as string;

    const res = await drive.permissions.create({
      fileId: file_id as string,
      requestBody: permission,
      fields: "id,role,type",
      sendNotificationEmail: false,
    });

    return {
      success: true,
      permission_id: res.data.id,
      role: res.data.role,
      type: res.data.type,
      shared_with: email ?? "anyone (public)",
    };
  },
};

export default tool;
