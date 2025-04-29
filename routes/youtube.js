const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

router.get('/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: '검색어가 필요합니다.' });
  }

  try {
    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Google API 키가 설정되지 않았습니다.' });
    }
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    const items = response.data.items || [];
    const results = items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
    res.json({ items: results });
  } catch (error) {
    console.error('YouTube 검색 오류:', error);
    res.status(500).json({ error: 'YouTube 검색 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
