require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const {
  connectDB,
  saveSearchData,
  getAllSearchData
} = require('./db.js'); // 기존 DB 함수 가져오기

// 추가 모듈 (형태소 분석 및 임베딩 가정)
const { analyzeMorphology } = require('./morphology.js'); // GitHub 루트 디렉토리의 morphology.js 참조
const { generateEmbedding } = require('./embedding');
const { analyzeIntent } = require('./intent');

// 기존 라우트
const searchRoute = require('./search');
const weatherRoute = require('./weather');

const app = express();
const port = process.env.PORT || 3000;

// CORS, JSON 파싱 설정
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*'
}));
app.use(express.json());

// MongoDB 연결 후 라우팅 셋업
connectDB()
  .then(() => {
    console.log('✅ MongoDB 연결 완료');

    // 1) 네이버 검색 API
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
        const data = await getAllSearchData();
        console.log('✅ /api/getData 호출 — 데이터 개수:', data.length);
        res.json(data);
      } catch (err) {
        console.error('[API] 데이터 가져오기 오류:', err.stack);
        res.status(500).json({ error: '데이터 가져오기 실패' });
      }
    });

    // 4) POST /api/log - 클라이언트 로그 받기
    app.post('/api/log', async (req, res) => {
      const logData = req.body;
      if (!logData) return res.status(400).json({ error: '로그 데이터가 필요합니다.' });
      try {
        await saveSearchData('log', 'client-log', logData);
        res.json({ message: '로그 데이터 저장 완료' });
      } catch (err) {
        console.error('[API] 로그 데이터 저장 오류:', err.stack);
        res.status(500).json({ error: '로그 데이터 저장 실패' });
      }
    });

    // 5) POST /api/save-to-db - 학습용 데이터 저장
    app.post('/api/save-to-db', async (req, res) => {
      const trainingData = req.body;
      if (!trainingData) return res.status(400).json({ error: '학습 데이터가 필요합니다.' });
      try {
        await saveSearchData('training', 'training-data', trainingData);
        res.json({ message: '학습 데이터 저장 완료' });
      } catch (err) {
        console.error('[API] 학습 데이터 저장 오류:', err.stack);
        res.status(500).json({ error: '학습 데이터 저장 실패' });
      }
    });

    // 6) POST /api/embed - 문장 임베딩 생성
    app.post('/api/embed', async (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });
      try {
        const embedding = await generateEmbedding(text);
        res.json({ message: '임베딩 생성 완료', embedding });
      } catch (err) {
        console.error('[API] 임베딩 생성 오류:', err.stack);
        res.status(500).json({ error: '임베딩 생성 실패' });
      }
    });

    // 7) POST /api/morph - 텍스트 형태소 분석
    app.post('/api/morph', async (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });
      try {
        const morphResult = await analyzeMorphology(text);
        res.json({ message: '형태소 분석 완료', result: morphResult });
      } catch (err) {
        console.error('[API] 형태소 분석 오류:', err.stack);
        res.status(500).json({ error: '형태소 분석 실패' });
      }
    });

    // 8) POST /api/intent - 텍스트로 의도 분석
    app.post('/api/intent', async (req, res) => {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });
      try {
        const intentResult = await analyzeIntent(text);
        res.json({ message: '의도 분석 완료', result: intentResult });
      } catch (err) {
        console.error('[API] 의도 분석 오류:', err.stack);
        res.status(500).json({ error: '의도 분석 실패' });
      }
    });

    // 9) GET /api/processed-data - 학습 데이터만 반환
    app.get('/api/processed-data', async (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      try {
        const allData = await getAllSearchData(limit);
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

    // 10) 기존 모듈 라우트
    app.use('/api', searchRoute);
    app.use('/api', weatherRoute);

    // 11) 정적 파일 서빙
    app.use(express.static(path.join(__dirname, 'public')));

    // 12) 서버 시작
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 오류:', err.stack);
    process.exit(1);
  });
