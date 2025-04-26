// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const { connectDB, saveSearchData } = require('./db.js');

const app  = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

connectDB().then(() => {
  app.listen(port, () =>
    console.log(`🚀 서버 실행 중: http://localhost:${port}`)
  );
});

// 네이버 검색
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

    // ① DB 저장: API 응답 객체 전체를 넘겨주면,
    //    db.js 에서 자동으로 문자열 추출→자모 토큰화→저장해 줍니다.
    await saveSearchData('naver', query, data);

    // ② 클라이언트에는 원하시는 형태(예: title+link 배열)만 응답
    const items = data.items.map(item => ({
      title: item.title,
      link:  item.link
    }));
    res.json({ message: `네이버 검색 완료: ${query}`, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 유튜브 검색
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
          key:        process.env.GOOGLE_API_KEY
        }
      }
    );

    // ① DB 저장: data 객체만 넘기면 db.js 가 알아서 라인 추출→토큰화→저장
    await saveSearchData('youtube', query, data);

    // ② 클라이언트 응답
    const items = data.items.map(i => {
      const vid = i.id.videoId;
      return {
        title: i.snippet.title,
        url:   vid ? `https://www.youtube.com/watch?v=${vid}` : ''
      };
    });
    res.json({ message: `YouTube 검색 완료: ${query}`, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'YouTube 검색 실패' });
  }
});
