const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우트 연결
const searchRoute = require('./search');
const weatherRoute = require('./weather');
const youtubeRoute = require('./youtube');
const searchWidgetRoute = require('./searchwidget');

app.use('/api', searchRoute);
app.use('/api', weatherRoute);
app.use('/api', youtubeRoute);
app.use('/api', searchWidgetRoute);

// 정적 파일 서빙 (클라이언트 파일)
app.use(express.static(path.join(__dirname, '../public')));

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});
