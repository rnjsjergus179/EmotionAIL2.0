const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우트 연결 (루트 경로 기준으로 수정)
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
