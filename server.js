require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { connectDB, saveSearchData } = require('./db.js');

// (search, weather 유지, youtubeRoute 제거)
const searchRoute = require('./search');
const weatherRoute = require('./weather');

const app = express();
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
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
        }
      }
    );

    await saveSearchData('naver', query, data);

    console.log(`✅ 네이버 검색 저장 완료: "${query}"`);
    res.json({ message: `네이버 검색 저장 완료: ${query}` });
  } catch (err) {
    console.error(`❌ 네이버 API 오류: ${err.message}`);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 4) YouTube 검색 + DB 저장 + items 같이 반환
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    console.log(`🔍 YouTube 검색 요청: "${query}"`);

    // YouTube Data API v3를 사용한 검색
    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: query,
          maxResults: 10,
          key: process.env.GOOGLE_API_KEY // GOOGLE_API_KEY 사용
        }
      }
    );

    await saveSearchData('youtube', query, data);

    console.log(`💾 YouTube 검색 저장 완료: "${query}"`);

    // 검색 결과를 프론트로 반환 (items 포함)
    res.json({
      message: `YouTube 검색 저장 완료: ${query}`,
      items: data.items.map(item => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }))
    });
  } catch (err) {
    console.error(`❌ YouTube API 오류: ${err.message}`);
    res.status(500).json({ error: 'YouTube 검색 실패' });
  }
});

// 5) 기존 라우트 연결 유지
app.use('/api', searchRoute);
app.use('/api', weatherRoute);

// 6) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 7) 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
