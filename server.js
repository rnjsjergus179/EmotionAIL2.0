require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs'); // 파일 시스템 모듈 추가

// 외부 라우트 가져오기 (별도 파일로 존재한다고 가정)
const weatherRoute = require('./weather');

// Express 앱 설정
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*' // 클라이언트 출처 설정
}));
app.use(express.json()); // JSON 요청 파싱

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

// **3. 학습용.txt 파일에 데이터 추가**
app.post('/append-to-learning-file', (req, res) => {
  const apiKey = req.headers['api_key'];
  const data = req.body.data;

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: '인증 실패: 유효한 API 키가 필요합니다.' });
  }

  if (!data) {
    return res.status(400).json({ error: '데이터가 필요합니다.' });
  }

  const filePath = path.join(__dirname, '학습용.txt'); // 파일 경로 설정 (서버의 파일 시스템)

  try {
    fs.appendFileSync(filePath, data + '\n'); // 줄바꿈 추가
    console.log('데이터가 학습용.txt에 추가되었습니다.');
    res.json({ message: '데이터가 성공적으로 추가되었습니다.' });
  } catch (err) {
    console.error('파일에 데이터 추가 중 오류:', err);
    res.status(500).json({ error: '파일에 데이터 추가 실패' });
  }
});

// **4. 기존 모듈 라우트 설정**
app.use('/api', weatherRoute);

// **5. 정적 파일 서빙**
app.use(express.static(path.join(__dirname, 'public')));

// **6. 서버 시작**
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
