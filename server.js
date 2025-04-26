// server.js
require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const axios         = require('axios');
const path          = require('path');
// ✅ 여기에 connectDB, saveSearchData 를 불러옵니다.
const { connectDB, saveSearchData } = require('./db.js');

const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DB 연결이 완료된 후에 라우트 등록 & 서버 시작
connectDB()
  .then(() => {
    console.log('✅ MongoDB 연결 완료');

    // — 라우트 정의 시작 — 

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

        // API 응답 데이터 전체(data) → db.js 에서 자동으로 라인 추출→자모 토큰화→저장
        await saveSearchData('naver', query, data);

        // 클라이언트에는 필요한 형태로만 응답
        const items = data.items.map(item => ({
          title: item.title,
          link:  item.link
        }));
        res.json({ message: `네이버 검색 완료: ${query}`, items });
      } catch (err) {
        console.error(`[API] 네이버 검색 오류:`, err.stack);
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

        // API 응답 전체를 넘겨 자모 토큰화 저장
        await saveSearchData('youtube', query, data);

        // 클라이언트 응답
        const items = data.items.map(i => {
          const vid = i.id.videoId;
          return {
            title: i.snippet.title,
            url:   vid ? `https://www.youtube.com/watch?v=${vid}` : ''
          };
        });
        res.json({ message: `YouTube 검색 완료: ${query}`, items });
      } catch (err) {
        console.error(`[API] YouTube 검색 오류:`, err.stack);
        res.status(500).json({ error: 'YouTube 검색 실패' });
      }
    });

    // (필요한 경우) 다른 라우트, 정적 파일 서빙 등…
    app.use(express.static(path.join(__dirname, 'public')));

    // 서버 리스닝
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });

  })
  .catch(err => {
    console.error(`❌ MongoDB 연결 오류:`, err.stack);
    process.exit(1);
  });
