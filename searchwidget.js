const express = require('express');
const router = express.Router();

router.get('/search-widget', (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }
  const googleWidgetBase = process.env.GOOGLE_WIDGET || 'https://www.google.com/search?q=';
  const searchUrl = `${googleWidgetBase}${encodeURIComponent(query)}`;
  res.json({ searchUrl });
});

module.exports = router;
