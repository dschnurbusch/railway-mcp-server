# Tool Authoring Guide

Tools in this server exist to give agents useful, clean information — not to dump raw API responses into context. Follow these principles when building new tools.

---

## 1. Shape the response before returning it

**The most important rule:** Never return a raw API response. APIs are designed for developers, not for LLMs. Most responses contain 90% noise.

**Before writing a tool, always:**
1. Make a real API call and capture the full raw response
2. Go through every field and ask: *"Would an agent or user ever need this?"*
3. Delete everything that answers "no"

```typescript
// BAD — dumps the raw API response
return await res.json();

// GOOD — return only what's useful
const raw = await res.json();
return {
  id: raw.data.id,
  from: raw.data.from,
  text: raw.data.body,
  sent_at: raw.data.created_at,
  // raw.data.internalId, raw.data.accountSid, raw.data.uri, etc. — omitted
};
```

**Fields that are almost always useless:**
- Internal IDs the agent will never reference
- API URIs and self-links
- Redundant timestamps (created_at vs createdAt vs dateCreated — pick one)
- Status codes that repeat the HTTP status
- Deeply nested objects with a single useful leaf value — flatten them

---

## 2. Truncate long text fields

Agents don't need the full text of a 50-page document to answer a question. Cap long fields:

```typescript
body_preview: rawBody.trim().slice(0, 2000),
snippet: raw.snippet.slice(0, 500),
```

For email bodies, prefer `text/plain` over `text/html`. Strip HTML tags if text/plain isn't available.

---

## 3. Return counts alongside arrays

Always tell the agent how many results exist, not just what's in the current page:

```typescript
return {
  total: data.totalItems,   // how many exist
  returned: items.length,   // how many are in this response
  items,
};
```

This lets the agent know whether it needs to paginate without having to count.

---

## 4. Fail loudly and clearly

If an API call fails, throw a descriptive error — don't return a partial result or swallow the error silently. The `invoke_tool` meta-tool will catch it and surface it as `isError: true`.

```typescript
if (!res.ok) {
  throw new Error(`ServiceName error ${res.status}: ${await res.text()}`);
}
```

---

## 5. Write lean descriptions

The `description` field is what the agent reads in `search_tools`. Make it scan-friendly: one sentence, action-oriented, says what it returns.

```typescript
// BAD
description: "This tool allows you to interact with the Airtable API to retrieve comments that have been added to matter records in the matters table."

// GOOD
description: "Retrieve all comments on an Airtable matter record."
```

The `tags` array is for fuzzy search — include synonyms and related concepts the agent might search for.

---

## 6. Use env vars for all credentials and config

Never hardcode API keys, base URLs, account IDs, or from-addresses. Every secret goes in a Railway environment variable.

```typescript
const apiKey = process.env.OPENPHONE_API_KEY!;
```

Add every new env var to `.env.example` with a description.

---

## 7. Keep tools focused

One tool, one job. Don't build a tool that searches emails AND downloads attachments AND parses PDFs. Split those into three tools. The progressive discovery pattern means the agent can find and chain focused tools — a Swiss Army knife tool is harder to discover and harder to maintain.

---

## 8. Template for a new tool

```typescript
import type { ToolDefinition } from "../../types.js";

const tool: ToolDefinition = {
  name: "verb_noun",               // snake_case, action-first
  category: "service_name",        // groups tools in search results
  description: "One sentence.",    // what it does + what it returns
  tags: ["service", "synonym"],    // words agents might search for
  schema: {
    type: "object",
    properties: {
      param_name: {
        type: "string",
        description: "Clear description. Include format hints (e.g. E.164, ISO 8601, recXXX).",
      },
    },
    required: ["param_name"],
  },
  async execute({ param_name }) {
    // 1. Call the API
    const raw = await fetchFromApi(param_name);

    // 2. Shape the response — only keep useful fields
    return {
      field: raw.usefulField,
    };
  },
};

export default tool;
```

Drop the file anywhere under `src/tools/<category>/` — the registry auto-discovers it on next deploy.

---

## Required env vars by tool

| Tool | Env vars needed |
|---|---|
| `fetch_emails` | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` |
| `get_matter_comments` | `AIRTABLE_API_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_MATTERS_TABLE` |
| `add_matter_comment` | `AIRTABLE_API_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_MATTERS_TABLE` |
| `fetch_text_history` | `OPENPHONE_API_KEY`, `OPENPHONE_PHONE_NUMBER_ID` |
| `send_mailing` | `DOCUPOST_API_TOKEN`, `DOCUPOST_FROM_NAME`, `DOCUPOST_FROM_ADDRESS1`, `DOCUPOST_FROM_CITY`, `DOCUPOST_FROM_STATE`, `DOCUPOST_FROM_ZIP` |
| `validate_citations` | `COURTLISTENER_API_TOKEN` *(optional — omit for 100 req/day, set for 5,000/hour)* |
