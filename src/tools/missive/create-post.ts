import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://public.missiveapp.com/v1";

function missiveHeaders() {
  return {
    Authorization: `Bearer ${process.env.MISSIVE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const tool: ToolDefinition = {
  name: "create_post",
  category: "missive",
  description: "Take action on a Missive conversation: close it, assign to a user, add/remove labels, or leave an internal note.",
  tags: ["missive", "post", "close", "assign", "label", "note", "action"],
  schema: {
    type: "object",
    properties: {
      conversation_id: {
        type: "string",
        description: "The Missive conversation ID to act on.",
      },
      text: {
        type: "string",
        description: "Internal note text to add (visible only to team).",
      },
      close: {
        type: "boolean",
        description: "Close the conversation.",
      },
      reopen: {
        type: "boolean",
        description: "Reopen a closed conversation (add_to_inbox: true).",
      },
      assignee_ids: {
        type: "array",
        description: "User IDs to assign the conversation to.",
      },
      add_shared_label_ids: {
        type: "array",
        description: "Shared label IDs to add.",
      },
      remove_shared_label_ids: {
        type: "array",
        description: "Shared label IDs to remove.",
      },
    },
    required: ["conversation_id"],
  },
  async execute({ conversation_id, text, close, reopen, assignee_ids, add_shared_label_ids, remove_shared_label_ids }) {
    const post: Record<string, unknown> = { conversation: { id: conversation_id } };
    if (text) post.text = text;
    if (close) post.close = true;
    if (reopen) post.add_to_inbox = true;
    if (assignee_ids) post.add_assignees = assignee_ids;
    if (add_shared_label_ids) post.add_shared_labels = add_shared_label_ids;
    if (remove_shared_label_ids) post.remove_shared_labels = remove_shared_label_ids;

    const res = await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: missiveHeaders(),
      body: JSON.stringify({ posts: post }),
    });
    if (!res.ok) throw new Error(`Missive error ${res.status}: ${await res.text()}`);

    return { success: true, conversation_id };
  },
};

export default tool;
