// server.js (프로젝트 루트에 위치)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const axios   = require('axios');
const { connectDB, saveSearchData } = require('./db.js');

// (기존 사용하던 search, weather만 유지하고 youtubeRoute는 제거)
const searchRoute  = require('./search');
const weatherRoute = require('./weather');
// const youtubeRoute = require('./youtube');  // ❌ 삭제

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

// 3) 네이버 검색 + DB 저장
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

    await saveSearchData('naver', query, data);

    console.log(`✅ 네이버 검색 저장 완료: "${query}"`);
    res.json(data);
  } catch (err) {
    console.error(`❌ 네이버 API 오류: ${err.message}`);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 4) YouTube 검색 + DB 저장
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    console.log(`🔍 YouTube 검색 요청: "${query}"`);

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

    console.log(`✅ YouTube API 호출 완료: "${query}"`);
    console.log(`🔗 db.js로 저장 요청: "${query}"`);

    await saveSearchData('youtube', query, data);

    console.log(`💾 YouTube 검색 저장 완료: "${query}"`);
    res.json(data);
  } catch (err) {
    console.error(`❌ YouTube API 오류: ${err.message}`);
    res.status(500).json({ error: 'YouTube 검색 실패' });
  }
});

// 5) 기존 라우트 연결 유지
app.use('/api', searchRoute);
app.use('/api', weatherRoute);
// app.use('/api', youtubeRoute); // ❌ 삭제

// 6) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 7) 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
