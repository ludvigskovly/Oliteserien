const SHEET_ID = "1qoqhDAtJyI_YQt_92-pTJ75eD_yRrXbRPt9JcjR0VSI";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }

    const csv = await response.text();
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    res.status(200).json({ source: "google", csv });
  } catch (error) {
    res.status(502).json({
      error: "Kunne ikke hente Google Sheet-data",
      detail: error.message,
    });
  }
};
