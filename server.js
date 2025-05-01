require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const {
  connectDB,
  saveSearchData,
  getAllSearchData
} = require('./db.js'); // MongoDB 연결 및 함수 가져오기

// 라우트 가져오기

const weatherRoute = require('./weather');

const app = express();
const port = process.env.PORT || 3000;

// CORS 및 JSON 파싱 설정
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*'
}));
app.use(express.json());

// MongoDB 연결 후 라우팅 및 서버 시작
connectDB()
  .then(() => {
    console.log('✅ MongoDB 연결 완료');

    // 1) 네이버 검색 API
    app.get('/api/naver-search', async (req, res) => {
      const query = req.query.q;
      if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });
      try {
        console.log(`[Render] 네이버 검색 호출 전: ${query}`);
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
        console.log(`[Render] 네이버 검색 호출 후: ${query}`);
        await saveSearchData('naver', query, data);
        const items = data.items.map(item => ({ title: item.title, link: item.link }));
        res.json({ message: `네이버 검색 완료: ${query}`, items });
      } catch (err) {
        console.error('[API] 네이버 검색 오류:', err.stack);
        res.status(500).json({ error: '네이버 검색 실패' });
      }
    });

    // 2) YouTube 검색 API
    app.get('/api/youtube-search', async (req, res) => {
      const query = req.query.q;
      if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });
      try {
        console.log(`[Render] YouTube 검색 호출 전: ${query}`);
        const { data } = await axios.get(
          'https://www.googleapis.com/youtube/v3/search',
          {
            params: {
              part: 'snippet',
              q: query,
              maxResults: 10,
              key: process.env.GOOGLE_API_KEY
            }
          }
        );
        console.log(`[Render] YouTube 검색 호출 후: ${query}`);
        await saveSearchData('youtube', query, data);
        const items = data.items.map(i => {
          const vid = i.id.videoId;
          return {
            title: i.snippet.title,
            url: vid ? `https://www.youtube.com/watch?v=${vid}` : ''
          };
        });
        res.json({ message: `YouTube 검색 완료: ${query}`, items });
      } catch (err) {
        console.error('[API] YouTube 검색 오류:', err.stack);
        res.status(500).json({ error: 'YouTube 검색 실패' });
      }
    });

    // 3) MongoDB에 저장된 검색 기록 불러오기
    app.get('/api/getData', async (req, res) => {
      try {
        console.log('[Render] MongoDB 데이터 불러오기 호출 전');
        const data = await getAllSearchData();
        console.log('[Render] MongoDB 데이터 불러오기 호출 후');
        console.log('✅ /api/getData 호출 — 데이터 개수:', data.length);
        res.json(data);
      } catch (err) {
        console.error('[API] 데이터 가져오기 오류:', err.stack);
        res.status(500).json({ error: '데이터 가져오기 실패' });
      }
    });

    // 4) 클라이언트 로그 저장
    app.post('/api/log', async (req, res) => {
      const logData = req.body;
      if (!logData) return res.status(400).json({ error: '로그 데이터가 필요합니다.' });
      try {
        console.log('[Render] 클라이언트 로그 저장 호출 전');
        await saveSearchData('log', 'client-log', logData);
        console.log('[Render] 클라이언트 로그 저장 호출 후');
        res.json({ message: '로그 데이터 저장 완료' });
      } catch (err) {
        console.error('[API] 로그 데이터 저장 오류:', err.stack);
        res.status(500).json({ error: '로그 데이터 저장 실패' });
      }
    });

    // 5) 학습용 데이터 저장
    app.post('/api/save-to-db', async (req, res) => {
      const trainingData = req.body;
      if (!trainingData) return res.status(400).json({ error: '학습 데이터가 필요합니다.' });
      try {
        console.log('[Render] 학습 데이터 저장 호출 전');
        await saveSearchData('training', 'training-data', trainingData);
        console.log('[Render] 학습 데이터 저장 호출 후');
        res.json({ message: '학습 데이터 저장 완료' });
      } catch (err) {
        console.error('[API] 학습 데이터 저장 오류:', err.stack);
        res.status(500).json({ error: '학습 데이터 저장 실패' });
      }
    });

    // 6) 가공된 학습 데이터 반환
    app.get('/api/processed-data', async (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      try {
        console.log('[Render] 가공 데이터 불러오기 호출 전');
        const allData = await getAllSearchData(limit);
        console.log('[Render] 가공 데이터 불러오기 호출 후');
        const trainingData = allData.filter(item => item.type === 'training');
        const processedData = trainingData.map(item => ({
          intent: item.intent || 'unknown',
          keywords: item.query ? item.query.split(' ') : []
        }));
        res.json({ message: `가공된 학습 데이터 ${processedData.length}개 반환`, data: processedData });
      } catch (err) {
        console.error('[API] 가공 데이터 불러오기 오류:', err.stack);
        res.status(500).json({ error: '가공 데이터 불러오기 실패' });
      }
    });

    // 7) 기존 모듈 라우트 설
    app.use('/api', weatherRoute);

    // 8) 정적 파일 서빙
    app.use(express.static(path.join(__dirname, 'public')));

    // 9) 서버 시작
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 오류:', err.stack);
    process.exit(1 multi);
  });
