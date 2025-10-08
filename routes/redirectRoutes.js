const express = require('express');
const router = express.Router();
const Url = require('../models/Url');

// Redirect route - separate from API routes
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    console.log('Redirect attempt for shortCode:', shortCode);

    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).send(`
        <html>
          <body>
            <h1>URL Not Found</h1>
            <p>The short URL you're looking for doesn't exist.</p>
            <a href="/">Create a new short URL</a>
          </body>
        </html>
      `);
    }

    // Update click count
    url.clicks += 1;
    await url.save();

    console.log('Redirecting to:', url.originalUrl);
    
    // Use meta refresh as fallback along with JavaScript
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="0; url=${url.originalUrl}">
          <script>
            window.location.href = '${url.originalUrl}';
          </script>
        </head>
        <body>
          <p>Redirecting to <a href="${url.originalUrl}">${url.originalUrl}</a>...</p>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send('Server error during redirect');
  }
});

module.exports = router;