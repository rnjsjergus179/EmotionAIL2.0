const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: '검색어가 필요합니다.' });
  }

  try {
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      return res.status(500).json({ error: 'Google API 키 또는 CSE ID가 설정되지 않았습니다.' });
    }
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}`;
    const response = await axios.get(url);
    const items = response.data.items || [];
    const results = items.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));
    res.json(results);
  } catch (error) {
    console.error('Google 검색 오류:', error);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
