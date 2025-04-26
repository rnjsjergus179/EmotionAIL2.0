// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const axios   = require('axios');
const { connectDB, saveSearchData } = require('./db.js');

// 기존 라우트 유지
const searchRoute  = require('./search');
const weatherRoute = require('./weather');

const app  = express();
const port = process.env.PORT || 3000;

// 1) MongoDB 연결
connectDB().catch(err => {
  console.error(`❌ MongoDB 연결 오류: ${err.message}`);
  process.exit(1);
});

// 2) 미들웨어 설정
app.use(cors());
app.use(express.json());

// 3) 네이버 검색 API 호출 → DB 저장
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    // 네이버 API 호출
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

    // DB에 저장 (API 응답 객체 그대로 넘김)
    await saveSearchData('naver', query, data);
    console.log(`✅ [naver] "${query}" 저장 완료.`);

    // 클라이언트에 필요한 형태로 응답
    const items = data.items.map(item => ({
      title: item.title,
      link:  item.link
    }));
    res.json({ message: `네이버 검색 완료: ${query}`, items });
  } catch (err) {
    console.error(`❌ 네이버 API 오류: ${err.message}`);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 4) 유튜브 검색 API 호출 → DB 저장
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    console.log(`🔍 YouTube 검색 요청: "${query}"`);

    // 유튜브 API 호출
    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part:       'snippet',
          q:          query,
          maxResults: 10,
          key:        process.env.GOOGLE_API_KEY
        }
      }
    );

    // DB에 저장 (API 응답 객체 그대로 넘김)
    await saveSearchData('youtube', query, data);
    console.log(`✅ [youtube] "${query}" 저장 완료.`);

    // 클라이언트에 필요한 형태로 응답
    const items = data.items.map(item => {
      const vid = item.id.videoId;
      return {
        title: item.snippet.title,
        url:   vid ? `https://www.youtube.com/watch?v=${vid}` : ''
      };
    });
    res.json({ message: `YouTube 검색 완료: ${query}`, items });
  } catch (err) {
    console.error(`❌ YouTube API 오류: ${err.message}`);
    res.status(500).json({ error: 'YouTube 검색 실패' });
  }
});

// 5) 기존 라우트 연결
app.use('/api', searchRoute);
app.use('/api', weatherRoute);

// 6) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 7) 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
