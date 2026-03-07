/**
 * QuickBooks Online OAuth2 token refresh helper.
 *
 * Required env vars:
 *   QB_CLIENT_ID       - Intuit app client ID
 *   QB_CLIENT_SECRET   - Intuit app client secret
 *   QB_REFRESH_TOKEN   - Long-lived refresh token
 *   QB_REALM_ID        - QuickBooks company ID
 *   QB_ENVIRONMENT     - "production" (default) or "sandbox"
 */

interface QBAuth {
  accessToken: string;
  baseUrl: string;
  realmId: string;
}

export async function getQBAuth(): Promise<QBAuth> {
  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  const refreshToken = process.env.QB_REFRESH_TOKEN;
  const realmId = process.env.QB_REALM_ID;

  if (!clientId || !clientSecret || !refreshToken || !realmId) {
    throw new Error(
      "Missing QuickBooks credentials. Set QB_CLIENT_ID, QB_CLIENT_SECRET, QB_REFRESH_TOKEN, and QB_REALM_ID."
    );
  }

  const isSandbox = process.env.QB_ENVIRONMENT === "sandbox";
  const baseUrl = isSandbox
    ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}`
    : `https://quickbooks.api.intuit.com/v3/company/${realmId}`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const resp = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`QuickBooks token refresh failed (${resp.status}): ${text}`);
  }

  const data = (await resp.json()) as { access_token: string };
  return { accessToken: data.access_token, baseUrl, realmId };
}

export async function fetchReport(
  reportName: string,
  params: Record<string, string>
): Promise<unknown> {
  const { accessToken, baseUrl } = await getQBAuth();

  const query = new URLSearchParams({ minorversion: "73", ...params }).toString();
  const url = `${baseUrl}/reports/${reportName}?${query}`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`QuickBooks API error (${resp.status}): ${text}`);
  }

  return resp.json();
}

/**
 * Recursively flattens QB report rows into a list of { label, values[] } lines.
 */
export function flattenRows(
  rows: any[],
  columns: string[],
  depth = 0
): Array<{ label: string; values: string[]; depth: number; type: string }> {
  const lines: Array<{ label: string; values: string[]; depth: number; type: string }> = [];

  for (const row of rows) {
    if (!row) continue;

    if (row.type === "Section") {
      if (row.Header?.ColData) {
        lines.push({
          label: row.Header.ColData[0]?.value ?? "",
          values: row.Header.ColData.slice(1).map((c: any) => c?.value ?? ""),
          depth,
          type: "header",
        });
      }
      if (row.Rows?.Row) {
        lines.push(...flattenRows(row.Rows.Row, columns, depth + 1));
      }
      if (row.Summary?.ColData) {
        lines.push({
          label: row.Summary.ColData[0]?.value ?? "Total",
          values: row.Summary.ColData.slice(1).map((c: any) => c?.value ?? ""),
          depth,
          type: "summary",
        });
      }
    } else if (row.type === "Data" && row.ColData) {
      lines.push({
        label: row.ColData[0]?.value ?? "",
        values: row.ColData.slice(1).map((c: any) => c?.value ?? ""),
        depth,
        type: "data",
      });
    }
  }

  return lines;
}

export function parseReport(raw: any): {
  title: string;
  period: string;
  columns: string[];
  lines: ReturnType<typeof flattenRows>;
} {
  const header = raw?.Header ?? {};
  const title = header.ReportName ?? "Report";
  const period =
    header.StartPeriod && header.EndPeriod
      ? `${header.StartPeriod} to ${header.EndPeriod}`
      : (header.ReportDate ?? "");

  const columns: string[] =
    raw?.Columns?.Column?.map((c: any) => c.ColTitle ?? c.ColType ?? "") ?? [];

  const rows = raw?.Rows?.Row ?? [];
  const lines = flattenRows(rows, columns);

  return { title, period, columns, lines };
}
