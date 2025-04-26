// server.js (프로젝트 루트에 위치)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const axios   = require('axios');
const { connectDB, saveSearchData } = require('./db.js');

// (기존에 사용하던) 커스텀 라우트들
const searchRoute  = require('./search');
const weatherRoute = require('./weather');
const youtubeRoute = require('./youtube');

const app  = express();
const port = process.env.PORT || 3000;

// 1) MongoDB 연결
connectDB().catch(err => {
  console.error(`❌ MongoDB 연결 오류: ${err.message}`);
  process.exit(1);
});

// 2) 미들웨어
app.use(cors());
app.use(express.json());

// 3) 기존 라우트 유지
app.use('/api', searchRoute);
app.use('/api', weatherRoute);
app.use('/api', youtubeRoute);

// 4) 네이버 검색 + DB 저장
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    const { data } = await axios.get(
      'https://openapi.naver.com/v1/search/webkr.json',
      {
        params: { query },
        headers: {
          'X-Naver-Client-Id':     process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
        }
      }
    );

    // db.js에 정의된 함수로 저장
    await saveSearchData('naver', query, data);

    res.json(data);
  } catch (err) {
    console.error(`❌ 네이버 API 오류: ${err.message}`);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 5) YouTube 검색 + DB 저장
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part:       'snippet',
          q:          query,
          maxResults: 10,
          key:        process.env.YOUTUBE_API_KEY
        }
      }
    );

    // db.js에 정의된 함수로 저장
    await saveSearchData('youtube', query, data);

    res.json(data);
  } catch (err) {
    console.error(`❌ YouTube API 오류: ${err.message}`);
    res.status(500).json({ error: 'YouTube 검색 실패' });
  }
});

// 6) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 7) 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
