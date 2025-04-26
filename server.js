// server.js
require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const axios         = require('axios');
const path          = require('path');
const { connectDB, saveSearchData } = require('./db.js');

const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DB 연결 및 서버 시작
connectDB()
  .then(() => {
    console.log('✅ MongoDB 연결 완료');

    // 네이버 검색
    app.get('/api/naver-search', async (req, res) => {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: '검색어가 필요합니다.' });
      }

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

        // DB에 자모 토큰화된 결과 저장
        await saveSearchData('naver', query, data);

        // 클라이언트에 필요한 데이터만 반환
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

    // 유튜브 검색 (GOOGLE_API_KEY 복구)
    app.get('/api/youtube-search', async (req, res) => {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: '검색어가 필요합니다.' });
      }

      try {
        const { data } = await axios.get(
          'https://www.googleapis.com/youtube/v3/search',
          {
            params: {
              part:       'snippet',
              q:          query,
              maxResults: 10,
              key:        process.env.GOOGLE_API_KEY    // ← 복구된 구글 API 키
            }
          }
        );

        // DB에 자모 토큰화된 결과 저장
        await saveSearchData('youtube', query, data);

        // 클라이언트에 필요한 데이터만 반환
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

    // 정적 파일 서빙
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
