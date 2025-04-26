// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const axios   = require('axios');
const { connectDB, saveSearchData } = require('./db.js');

const { google } = require('googleapis');
const youtube    = google.youtube({
  version: 'v3',
  auth:    process.env.YOUTUBE_API_KEY
});

const app = express();
const port = process.env.PORT || 3000;

// MongoDB 연결
connectDB().catch(err => {
  console.error(`MongoDB 연결 오류: ${err.message}`);
  process.exit(1);
});

app.use(cors());
app.use(express.json());

// ── 네이버 검색 ───────────────────────────────────────
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    const naverRes = await axios.get(
      'https://openapi.naver.com/v1/search/webkr.json',
      {
        params: { query },
        headers: {
          'X-Naver-Client-Id':     process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
        }
      }
    );
    const results = naverRes.data;

    // DB에 저장
    await saveSearchData('naver', query, results);

    res.json(results);
  } catch (error) {
    console.error('❌ 네이버 API 호출 오류:', error.message);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// ── YouTube 검색 ─────────────────────────────────────
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    // YouTube Data API 호출
    const ytRes = await youtube.search.list({
      part:       'snippet',
      q:          query,
      maxResults: 10
    });
    const results = ytRes.data;  // JSON 형태(Mixed)

    // DB에 저장
    await saveSearchData('youtube', query, results);

    res.json(results);
  } catch (error) {
    console.error('❌ YouTube API 호출 오류:', error.message);
    res.status(500).json({ error: 'YouTube 검색 실패' });
  }
});

// (기타 라우트)
// app.use('/api', require('./search'));
// app.use('/api', require('./weather'));
// …

app.use(express.static(path.join(__dirname, '../public')));

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
