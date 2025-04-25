// server.js (프로젝트 루트에 위치)

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const axios   = require('axios');

const { connectDB, SearchLog, InteractionLog } = require('./db.js');
const logger = require('./logger.js');

const app  = express();
const port = process.env.PORT || 3000;

// 1) MongoDB 연결
connectDB().catch(err => {
  logger.error(`DB 연결 오류: ${err.message}`);
  process.exit(1);
});

// 2) 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 간단 토큰화 예시 ---
function tokenize(text) {
  return text
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

// 3) 네이버 검색 + DB 저장
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    const naverRes = await axios.get(
      'https://openapi.naver.com/v1/search/webkr.json',
      {
        params: { query },
        headers: {
          'X-Naver-Client-Id':     process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
        }
      }
    );

    const results = naverRes.data;
    await SearchLog.create({
      source:  'naver',
      query,
      tokens:  tokenize(query),
      results
    });

    logger.info(`네이버 검색 저장 성공: ${query}`);
    res.json(results);
  } catch (err) {
    logger.error(`네이버 검색 오류: ${err.message}`);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 4) 유튜브 검색 + DB 저장
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    const youRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part:       'snippet',
          q:          query,
          key:        process.env.YOUTUBE_API_KEY,
          maxResults: 5
        }
      }
    );

    const results = youRes.data;
    await SearchLog.create({
      source:  'youtube',
      query,
      tokens:  tokenize(query),
      results
    });

    logger.info(`유튜브 검색 저장 성공: ${query}`);
    res.json(results);
  } catch (err) {
    logger.error(`유튜브 검색 오류: ${err.message}`);
    res.status(500).json({ error: '유튜브 검색 실패' });
  }
});

// 5) 구글 검색 + DB 저장 (Custom Search)
app.get('/api/google-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    const gRes = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key:  process.env.GOOGLE_API_KEY,
          cx:   process.env.GOOGLE_CX,
          q:    query,
          num:  5
        }
      }
    );

    const results = gRes.data;
    await SearchLog.create({
      source:  'google',
      query,
      tokens:  tokenize(query),
      results
    });

    logger.info(`구글 검색 저장 성공: ${query}`);
    res.json(results);
  } catch (err) {
    logger.error(`구글 검색 오류: ${err.message}`);
    res.status(500).json({ error: '구글 검색 실패' });
  }
});

// 6) NLP 처리 + Interaction 저장
app.post('/api/nlp', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: '텍스트가 필요합니다.' });

  // (실제 감정분석/의도인식 로직은 여기에)
  const responseText = `입력하신 "${text}"에 대해 응답 생성 완료.`;

  await InteractionLog.create({
    userInput:    text,
    botResponse:  responseText,
    emotionCounts: { positive: 0, negative: 0, surprise: 0 }
  });

  logger.info(`NLP 저장 성공: ${text}`);
  res.json({ response: responseText });
});

// 7) 서버 시작
app.listen(port, () => {
  logger.info(`서버 실행 중: http://localhost:${port}`);
});
