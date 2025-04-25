require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { connectDB, SearchLog, InteractionLog } = require('./db');
const logger = require('./logger'); // 루트 디렉토리의 logger.js 불러오기

const app = express();
const port = process.env.PORT || 3000;

// MongoDB 연결
connectDB().catch(err => {
  logger.error(`DB 연결 오류: ${err.message}`); // 연결 실패 시 로그 기록
  process.exit(1);
});

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 환경 변수에서 네이버 API 키 가져오기
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// 검색·상호작용 로그 저장 엔드포인트
app.post('/api/save-to-db', async (req, res) => {
  const { type, query, results, tokens } = req.body;
  try {
    if (['google', 'naver', 'youtube'].includes(type)) {
      // SearchLog에 저장
      await SearchLog.create({
        source: type,
        query,
        tokens: Array.isArray(tokens) ? tokens : [],
        results
      });
      // logger.js로 API 데이터 저장
      await logger.saveApiData(type, query, results);
    } else {
      // InteractionLog에 저장
      await InteractionLog.create({
        userInput: query,
        botResponse: results,
        // emotionCounts는 기본값 사용
      });
      // logger.js로 상호작용 데이터 저장
      await logger.saveApiData('interaction', query, results);
    }
    logger.info(`데이터 저장 성공: ${type} - ${query}`); // 성공 로그 기록
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`DB 저장 오류: ${err.message}`); // 오류 로그 기록
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 네이버 검색 통합 엔드포인트
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    logger.warn('검색어 미입력'); // 경고 로그 기록
    return res.status(400).json({ error: '검색어가 필요합니다.' });
  }
  try {
    const naverRes = await axios.get(
      'https://openapi.naver.com/v1/search/webkr.json',
      {
        params: { query },
        headers: {
          'X-Naver-Client-Id': NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
        }
      }
    );
    logger.info(`네이버 검색 성공: ${query}`); // 성공 로그 기록
    res.json(naverRes.data);
  } catch (error) {
    logger.error(`네이버 API 호출 오류: ${error.message}`); // 오류 로그 기록
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 기타 API 라우트
const searchRoute = require('./search');
const weatherRoute = require('./weather');
const youtubeRoute = require('./youtube');
app.use('/api', searchRoute);
app.use('/api', weatherRoute);
app.use('/api', youtubeRoute);

// 정적 파일 서빙 (클라이언트)
app.use(express.static(path.join(__dirname, '../public')));

// 서버 시작
app.listen(port, () => {
  logger.info(`서버가 포트 ${port}에서 실행 중입니다.`); // 서버 시작 로그 기록
});
