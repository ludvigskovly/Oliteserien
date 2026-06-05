const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const LIVE = process.env.LIVE === "1";
const SHEET_ID = "1qoqhDAtJyI_YQt_92-pTJ75eD_yRrXbRPt9JcjR0VSI";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const PUBLIC_DIR = path.join(__dirname, "public");
const FALLBACK_CSV = path.join(__dirname, "..", "..", "work", "liteserien.csv");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function fetchSheet(url = SHEET_URL, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        if (redirects > 5) {
          reject(new Error("Too many Google Sheets redirects"));
          return;
        }
        resolve(fetchSheet(new URL(response.headers.location, url).toString(), redirects + 1));
        return;
      }

      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`Google Sheets returned ${response.statusCode}`));
        response.resume();
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });

    request.setTimeout(7000, () => {
      request.destroy(new Error("Google Sheets request timed out"));
    });
    request.on("error", reject);
  });
}

async function handleSheet(res) {
  const payload = await getSheetPayload();
  send(res, 200, JSON.stringify(payload), "application/json; charset=utf-8");
}

async function getSheetPayload() {
  try {
    if (!LIVE) {
      throw new Error("Local snapshot mode");
    }
    const csv = await fetchSheet();
    return { source: "google", csv };
  } catch (error) {
    if (fs.existsSync(FALLBACK_CSV)) {
      const csv = fs.readFileSync(FALLBACK_CSV, "utf8");
      return { source: "local snapshot", warning: error.message, csv };
    }

    throw error;
  }
}

async function handleStatic(req, res) {
  const urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;
  const safePath = path.normalize(urlPath === "/" ? "/index.html" : urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath);
  if (safePath === "/index.html") {
    try {
      const payload = await getSheetPayload();
      const html = fs.readFileSync(filePath, "utf8").replace(
        "<!--SHEET_DATA-->",
        `<script>window.__SHEET_PAYLOAD__=${JSON.stringify(payload)};</script>`,
      );
      send(res, 200, html, MIME_TYPES[ext]);
      return;
    } catch (error) {
      const html = fs.readFileSync(filePath, "utf8").replace(
        "<!--SHEET_DATA-->",
        `<script>window.__SHEET_PAYLOAD__=${JSON.stringify({ error: error.message })};</script>`,
      );
      send(res, 200, html, MIME_TYPES[ext]);
      return;
    }
  }

  send(res, 200, fs.readFileSync(filePath), MIME_TYPES[ext] || "application/octet-stream");
}

const server = http.createServer((req, res) => {
  if (req.url && (req.url.startsWith("/data.json") || req.url.startsWith("/api/sheet"))) {
    handleSheet(res);
    return;
  }

  handleStatic(req, res);
});

server.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  process.exitCode = 1;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Øliteserien app running at http://localhost:${PORT}`);
});
