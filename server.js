require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { connectDB, saveSearchData, getAllSearchData } = require('./db.js');

const searchRoute = require('./search');
const weatherRoute = require('./weather');

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// MongoDB 연결 및 서버 시작
connectDB()
  .then(() => {
    console.log('✅ MongoDB 연결 완료');

    // 네이버 검색 API 엔드포인트
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
        const items = (data.items || []).map(item => ({
          title: item.title,
          link: item.link
        }));
        res.json({ message: `네이버 검색 완료: ${query}`, items });
      } catch (err) {
        console.error(`[API][naver-search] 오류:`, err.stack);
        res.status(500).json({ error: '네이버 검색 실패' });
      }
    });

    // 유튜브 검색 API 엔드포인트
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
        const items = (data.items || []).map(i => ({
          title: i.snippet.title,
          url: i.id.videoId ? `https://www.youtube.com/watch?v=${i.id.videoId}` : ''
        }));
        res.json({ message: `YouTube 검색 완료: ${query}`, items });
      } catch (err) {
        console.error(`[API][youtube-search] 오류:`, err.stack);
        res.status(500).json({ error: 'YouTube 검색 실패' });
      }
    });

    // MongoDB 저장 데이터 조회 API 엔드포인트
    app.get('/api/getData', async (req, res) => {
      console.log('🔍 [GET /api/getData] 요청 들어옴');
      try {
        const data = await getAllSearchData();
        if (!Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ [GET /api/getData] 저장된 문서가 없습니다.');
        } else {
          console.log(`🎉 [GET /api/getData] 총 ${data.length}개 문서 조회됨`);
        }
        console.log('💯 몽고 API 호출 완료!');
        res.json(data);
      } catch (err) {
        console.error('❌ [GET /api/getData] 데이터 가져오기 오류:', err.stack);
        res.status(500).json({ error: '데이터 가져오기 실패' });
      }
    });

    // processed-data 엔드포인트: 배열을 직접 전송
    app.get('/api/processed-data', async (req, res) => {
      console.log('🔍 [GET /api/processed-data] 요청 들어옴');
      try {
        const data = await getAllSearchData();
        if (!Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ [GET /api/processed-data] 저장된 문서가 없습니다.');
          return res.status(404).json({ error: '데이터가 없습니다.' });
        }
        const processedData = data.map(doc => doc.results).flat().join(" ");
        console.log('💯 처리된 데이터 전송 완료!');
        res.json(processedData.split(" ")); // 클라이언트가 기대하는 배열 형태로 전송
      } catch (err) {
        console.error('❌ [GET /api/processed-data] 데이터 처리 오류:', err.stack);
        res.status(500).json({ error: '데이터 처리 실패' });
      }
    });

    // 클라이언트 로그 수신 엔드포인트
    app.post('/api/log', (req, res) => {
      const { message } = req.body;
      if (message) {
        console.log(`📝 [클라이언트 로그] ${message}`);
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: '메시지가 없습니다.' });
      }
    });

    // NLP API 엔드포인트 (추가)
    app.post('/api/nlp', (req, res) => {
      const { text, processedData } = req.body;
      if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });
      const dummyResponse = `당신이 입력한 '${text}'에 대한 NLP 응답입니다.`;
      console.log(`🧠 [NLP 응답] text: ${text}`);
      res.json({ response: dummyResponse });
    });

    // 의도 인식 API 엔드포인트 (추가)
    app.post('/api/intent', (req, res) => {
      const { text, processedData } = req.body;
      if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });
      let intent = null;
      if (text.includes("안녕")) {
        intent = "greetings";
      }
      console.log(`🧠 [Intent 응답] text: ${text} => intent: ${intent}`);
      res.json({ intent });
    });

    // 추가 라우트 연결
    app.use('/api', searchRoute);
    app.use('/api', weatherRoute);

    // 정적 파일 서빙
    app.use(express.static(path.join(__dirname, 'public')));

    // 서버 시작
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 오류:', err.stack);
    process.exit(1);
  });
