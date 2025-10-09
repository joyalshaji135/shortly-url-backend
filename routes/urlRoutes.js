const express = require("express");
const router = express.Router();
const Url = require("../models/Url");

// Generate short code
function generateShortCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// POST /shorten - Create short URL
router.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    // ✅ Ensure proper URL format
    let validUrl = originalUrl;
    if (
      !originalUrl.startsWith("http://") &&
      !originalUrl.startsWith("https://")
    ) {
      validUrl = `https://${originalUrl}`;
    }

    try {
      new URL(validUrl);
    } catch (err) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // ✅ Check if URL already exists
    let url = await Url.findOne({ originalUrl: validUrl });

    // ✅ Dynamic BASE_URL based on environment
    const BASE_URL = process.env.BASE_URL || 
                    (process.env.NODE_ENV === 'production' 
                      ? 'https://joyalshaji.com' 
                      : `http://${req.headers.host}`);

    if (url) {
      return res.json({
        originalUrl: url.originalUrl,
        shortUrl: `${BASE_URL}/${url.shortCode}`,
        shortCode: url.shortCode,
      });
    }

    // ✅ Generate unique short code
    let shortCode;
    let isUnique = false;

    while (!isUnique) {
      shortCode = generateShortCode();
      const existingUrl = await Url.findOne({ shortCode });
      if (!existingUrl) isUnique = true;
    }

    // ✅ Save new URL
    url = new Url({
      originalUrl: validUrl,
      shortCode,
    });

    await url.save();

    // ✅ Response with correct domain
    res.status(201).json({
      originalUrl: url.originalUrl,
      shortUrl: `${BASE_URL}/${url.shortCode}`,
      shortCode: url.shortCode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Redirect route - FIXED
router.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    console.log(`Redirect attempt for shortCode: ${shortCode}`);

    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({ 
        error: "Short URL not found",
        message: "The requested short URL does not exist in our system."
      });
    }

    // ✅ Update click count
    url.clicks += 1;
    await url.save();

    console.log(`Redirecting to: ${url.originalUrl}`);
    
    // ✅ PROPER REDIRECT - Use 301 for permanent or 302 for temporary
    res.redirect(302, url.originalUrl);
    
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).json({ error: "Server error during redirect" });
  }
});

// GET /api/urls - Get all URLs (for debugging)
router.get("/urls/all", async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
