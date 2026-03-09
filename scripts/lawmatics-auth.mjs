#!/usr/bin/env node
/**
 * One-time Lawmatics OAuth2 setup script.
 *
 * Usage:
 *   node scripts/lawmatics-auth.mjs
 *
 * Reads LAWMATICS_CLIENT_ID and LAWMATICS_CLIENT_SECRET from .env automatically.
 * On success, writes LAWMATICS_ACCESS_TOKEN back into .env.
 *
 * The token never expires — run this once and you're done.
 */

import http from "http";
import fs from "fs";
import path from "path";
import { URL } from "url";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../.env");

const AUTHORIZE_URL = "https://app.lawmatics.com/oauth/authorize";
const TOKEN_URL = "https://api.lawmatics.com/oauth/token";
const REDIRECT_URI = "http://localhost:8788/oauth/callback";
const PORT = 8788;

// ── .env helpers ─────────────────────────────────────────────────────────────

function parseEnv(raw) {
  const vars = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    vars[key] = val;
  }
  return vars;
}

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  return parseEnv(fs.readFileSync(ENV_PATH, "utf8"));
}

function writeEnvKey(key, value) {
  let raw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const pattern = new RegExp(`^(${key}=.*)$`, "m");
  if (pattern.test(raw)) {
    raw = raw.replace(pattern, `${key}=${value}`);
  } else {
    raw = raw.trimEnd() + `\n${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, raw, "utf8");
}

// ── OAuth helpers ─────────────────────────────────────────────────────────────

async function exchangeCode(clientId, clientSecret, code) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = readEnv();

  const clientId = env.LAWMATICS_CLIENT_ID;
  const clientSecret = env.LAWMATICS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "Error: LAWMATICS_CLIENT_ID and LAWMATICS_CLIENT_SECRET must be set in .env"
    );
    process.exit(1);
  }

  console.log("Loaded credentials from .env");

  const authUrl =
    `${AUTHORIZE_URL}?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code`;

  console.log("\n─────────────────────────────────────────────────────────");
  console.log("Open this URL in your browser and authorize the app:\n");
  console.log(authUrl);
  console.log("\n─────────────────────────────────────────────────────────");
  console.log("Waiting for callback on http://localhost:" + PORT + " ...\n");

  await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);

      if (url.pathname !== "/oauth/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400);
        res.end(`<h1>Authorization denied: ${error}</h1>`);
        server.close();
        reject(new Error(`Authorization denied: ${error}`));
        return;
      }

      if (!code) {
        res.writeHead(400);
        res.end("<h1>No code received</h1>");
        server.close();
        reject(new Error("No code in callback"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<h1>Authorization successful!</h1><p>You can close this tab. Check your terminal for the token.</p>"
      );
      server.close();

      console.log("Received grant code — exchanging for access token...");

      try {
        const tokenData = await exchangeCode(clientId, clientSecret, code);
        const token = tokenData.access_token;

        writeEnvKey("LAWMATICS_ACCESS_TOKEN", token);

        console.log("\n─────────────────────────────────────────────────────────");
        console.log("SUCCESS! LAWMATICS_ACCESS_TOKEN written to .env");
        console.log("Token does not expire — you're done.");
        console.log("─────────────────────────────────────────────────────────\n");
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    server.listen(PORT, () => {});
    server.on("error", reject);
  });
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
