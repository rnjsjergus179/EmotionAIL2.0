const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// 환경 변수에서 네이버 API 정보 가져오기
const NAVER_API = {
  clientId: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  baseUrl: 'https://openapi.naver.com/v1/search/webkr.json'
};

// GET /api/naver-search?q=검색어
router.get('/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    const response = await fetch(`${NAVER_API.baseUrl}?query=${encodeURIComponent(query)}&display=5&start=1`, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER_API.clientId,
        'X-Naver-Client-Secret': NAVER_API.clientSecret,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('네이버 검색 오류:', error);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

module.exports = router;
