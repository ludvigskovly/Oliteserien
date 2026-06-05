const SHEET_ID = "1qoqhDAtJyI_YQt_92-pTJ75eD_yRrXbRPt9JcjR0VSI";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const https = require("https");

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

module.exports = async function handler(req, res) {
  try {
    const csv = await fetchSheet();
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    res.status(200).json({ source: "google", csv });
  } catch (error) {
    res.status(502).json({
      error: "Kunne ikke hente Google Sheet-data",
      detail: error.message,
    });
  }
};
