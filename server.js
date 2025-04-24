const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // axios 모듈 추가
require('dotenv').config(); // 환경 변수 로드

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 환경 변수에서 네이버 API 키 가져오기
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// 사용자가 제공한 네이버 검색 엔드포인트 통합
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: '검색어가 필요합니다.' });
  }

  try {
    const naverResponse = await axios.get('https://openapi.naver.com/v1/search/webkr.json', {
      params: { query },
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });
    res.json(naverResponse.data);
  } catch (error) {
    console.error('네이버 API 호출 오류:', error);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 기존 라우트 연결 (필요 시 유지)
const searchRoute = require('./search');
const weatherRoute = require('./weather');
const youtubeRoute = require('./youtube');
const naverRoute = require('./naver');
app.use('/api', searchRoute);
app.use('/api', weatherRoute);
app.use('/api', youtubeRoute);
app.use('/api', naverRoute);

// 정적 파일 서빙 (클라이언트 파일)
app.use(express.static(path.join(__dirname, '../public')));

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});
