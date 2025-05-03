require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');

// 외부 라우트 가져오기 (별도 파일로 존재한다고 가정)
const weatherRoute = require('./weather');

// MongoDB 스키마 정의
const SearchLogSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['naver', 'youtube', 'training', 'client-log'], // 가능한 소스 값
    required: true
  },
  query: String, // 검색어 또는 로그 식별자
  results: mongoose.Schema.Types.Mixed // 다양한 형식의 결과 저장
});

// MongoDB 모델 생성
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);

// MongoDB 연결 및 데이터 처리 함수 정의
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const saveSearchData = async (source, query, results) => {
  const log = new SearchLog({ source, query, results });
  await log.save();
};

const getAllSearchData = async (limit = 100) => {
  return await SearchLog.find().limit(limit);
};

// Express 앱 설정
const app = express();
const port = process.env.PORT || 5000; // 새로운 홈페이지 포트(5000)로 설정

// 미들웨어 설정
app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || '*',
    'https://refactored-trout-97wq976vp9g5cpxjg-5000.app.github.dev' // 새로운 홈페이지 출처 추가
  ]
}));
app.use(express.json()); // JSON 요청 파싱

// MongoDB 연결 후 서버 설정
connectDB()
  .then(() => {
    console.log('✅ MongoDB 연결 완료');

    // **1. 네이버 검색 API**
    app.get('/api/naver-search', async (req, res) => {
      const query = req.query.q;
      if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });
      try {
        console.log(`[Render] 네이버 검색 호출전.출력중입니다.‼️: ${query}`);
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
        console.log(`[Render] 네이버 검색 호출후.출력성공💯: ${query}`);
        await saveSearchData('naver', query, data);
        const items = data.items.map(item => ({ title: item.title, link: item.link }));
        res.json({ message: `네이버 검색 완료: ${query}`, items });
      } catch (err) {
        console.error('[API] 네이버 검색 오류:', err.stack);
        res.status(500).json({ error: '네이버 검색 실패' });
      }
    });

    // **2. YouTube 검색 API**
    app.get('/api/youtube-search', async (req, res) => {
      const query = req.query.q;
      if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });
      try {
        console.log(`[Render] YouTube 검색 호출전.출력중입니다.‼️: ${query}`);
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
        console.log(`[Render] YouTube 검색 호출후.출력성공💯: ${query}`);
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

    // **3. MongoDB에 저장된 검색 기록 불러오기**
    app.get('/api/getData', async (req, res) => {
      try {
        console.log('[Render] MongoDB 데이터 불러오기 호출전.출력중입니다.‼️');
        const data = await getAllSearchData();
        console.log('[Render] MongoDB 데이터 불러오기 호출후.출력성공💯');
        console.log('✅ /api/getData 호출 — 데이터 개수:', data.length);
        res.json(data);
      } catch (err) {
        console.error('[API] 데이터 가져오기 오류:', err.stack);
        res.status(500).json({ error: '데이터 가져오기 실패' });
      }
    });

    // **4. 클라이언트 로그 저장**
    app.post('/api/log', async (req, res) => {
      const logData = req.body;
      if (!logData) return res.status(400).json({ error: '로그 데이터가 필요합니다.' });
      try {
        console.log('[Render] 클라이언트 로그 저장 호출전.출력중입니다.‼️');
        await saveSearchData('client-log', 'client-log', logData);
        console.log('[Render] 클라이언트 로그 저장 호출후.출력성공💯');
        res.json({ message: '로그 데이터 저장 완료' });
      } catch (err) {
        console.error('[API] 로그 데이터 저장 오류:', err.stack);
        res.status(500).json({ error: '로그 데이터 저장 실패' });
      }
    });

    // **5. 학습용 데이터 저장**
    app.post('/api/save-to-db', async (req, res) => {
      const trainingData = req.body;
      if (!trainingData) return res.status(400).json({ error: '학습 데이터가 필요합니다.' });
      try {
        console.log('[Render] 학습 데이터 저장 호출전.출력중입니다.‼️');
        await saveSearchData('training', 'training-data', trainingData);
        console.log('[Render] 학습 데이터 저장 호출후.출력성공💯');
        res.json({ message: '학습 데이터 저장 완료' });
      } catch (err) {
        console.error('[API] 학습 데이터 저장 오류:', err.stack);
        res.status(500).json({ error: '학습 데이터 저장 실패' });
      }
    });

    // **6. 가공된 학습 데이터 반환**
    app.get('/api/processed-data', async (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      try {
        console.log('[Render] 가공 데이터 불러오기 호출전.출력중입니다.‼️');
        const allData = await getAllSearchData(limit);
        console.log('[Render] 가공 데이터 불러오기 호출후.출력성공💯');
        const trainingData = allData.filter(item => item.source === 'training');
        const processedData = trainingData.map(item => ({
          intent: item.results.intent || 'unknown',
          keywords: item.query ? item.query.split(' ') : []
        }));
        res.json({ message: `가공된 학습 데이터 ${processedData.length}개 반환`, data: processedData });
      } catch (err) {
        console.error('[API] 가공 데이터 불러오기 오류:', err.stack);
        res.status(500).json({ error: '가공 데이터 불러오기 실패' });
      }
    });

    // **7. 기존 모듈 라우트 설정**
    app.use('/api', weatherRoute);

    // **8. 정적 파일 서빙**
    app.use(express.static(path.join(__dirname, 'public')));

    // **9. 서버 시작**
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 오류:', err.stack);
    process.exit(1); // 오류 발생 시 프로세스 종료
  });
