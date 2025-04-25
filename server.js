require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { connectDB, SearchLog } = require('./db.js'); // db.js에서 연결 함수와 모델 가져오기

const app = express();
const port = process.env.PORT || 3000;

// MongoDB 연결 초기화
connectDB().catch(err => {
  console.error(`MongoDB 연결 오류: ${err.message}`);
  process.exit(1);
});

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 환경 변수에서 네이버 API 키 가져오기
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// 네이버 검색 통합 엔드포인트 (API 호출 후 DB에 저장)
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
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
    const results = naverRes.data;

    // SearchLog 모델을 통해 MongoDB에 데이터 저장
    await SearchLog.create({
      source: 'naver',
      query,
      tokens: [], // 필요 시 토큰화 데이터 추가 가능
      results
    });
    console.log(`✅ 검색 데이터 저장 완료: ${query}`);

    res.json(results);
  } catch (error) {
    console.error('❌ 네이버 API 호출 오류:', error.message);
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
  console.log(`🚀 서버가 포트 ${port}에서 실행 중입니다.`);
});
