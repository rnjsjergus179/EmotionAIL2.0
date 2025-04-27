require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const axios         = require('axios');
const path          = require('path');
const { connectDB, saveSearchData, getAllSearchData } = require('./db.js'); // getAllSearchData 추가

// ✅ 기존 라우트
const searchRoute  = require('./search');
const weatherRoute = require('./weather');

const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DB 연결 및 서버 시작
connectDB()
  .then(() => {
    console.log('✅ MongoDB 연결 완료');

    // [1] 네이버 검색 API
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
        await saveSearchData('naver', query, data);
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

    // [2] 유튜브 검색 API
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
              key:        process.env.GOOGLE_API_KEY
            }
          }
        );
        await saveSearchData('youtube', query, data);
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

    // [3] ✅ MongoDB에 저장된 데이터 불러오기 API
    app.get('/api/getData', async (req, res) => {
      try {
        const data = await getAllSearchData();  // db.js에서 불러온 함수
        console.log('몽고 API 호출 성공😃');     // 로그 추가
        res.json(data);
      } catch (err) {
        console.error(`[API] 데이터 가져오기 오류:`, err.stack);
        res.status(500).json({ error: '데이터 가져오기 실패' });
      }
    });

    // [4] 기존 search, weather 라우트 연결
    app.use('/api', searchRoute);
    app.use('/api', weatherRoute);

    // [5] 정적 파일(public 폴더) 서빙
    app.use(express.static(path.join(__dirname, 'public')));

    // [6] 서버 실행
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error(`❌ MongoDB 연결 오류:`, err.stack);
    process.exit(1);
  });
