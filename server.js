// server.js (DB 코드 제거판)

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const axios   = require('axios');
const logger  = require('./logger'); // 루트 디렉토리의 logger.js

const app  = express();
const port = process.env.PORT || 3000;

// --- 미들웨어 설정 ---
app.use(cors());
app.use(express.json());

// --- 환경 변수에서 네이버 API 키 가져오기 ---
const NAVER_CLIENT_ID     = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// --- 네이버 검색 통합 엔드포인트 ---
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    logger.warn('네이버 검색: 검색어 미입력');
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

    logger.info(`네이버 검색 성공: ${query}`);
    res.json(naverRes.data);

  } catch (error) {
    logger.error(`네이버 API 호출 오류: ${error.message}`);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// --- 기타 API 라우트 ---
const searchRoute  = require('./search');
const weatherRoute = require('./weather');
const youtubeRoute = require('./youtube');
app.use('/api', searchRoute);
app.use('/api', weatherRoute);
app.use('/api', youtubeRoute);

// --- 정적 파일 서빙 (클라이언트) ---
app.use(express.static(path.join(__dirname, '../public')));

// --- 서버 시작 ---
app.listen(port, () => {
  logger.info(`서버가 포트 ${port}에서 실행 중입니다.`);
});
