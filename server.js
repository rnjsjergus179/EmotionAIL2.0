// server.js (프로젝트 루트에 위치)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const axios   = require('axios');
const { connectDB, saveSearchData } = require('./db.js');

// (search, weather 유지, youtubeRoute 제거)
const searchRoute  = require('./search');
const weatherRoute = require('./weather');

const app  = express();
const port = process.env.PORT || 3000;

// 임시 파일 저장용 디렉토리 생성
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// 1) MongoDB 연결
connectDB().catch(err => {
  console.error(`❌ MongoDB 연결 오류: ${err.message}`);
  process.exit(1);
});

// 2) 미들웨어
app.use(cors());
app.use(express.json());

// 3) 네이버 검색 → 텍스트 파일로 변환 → DB 저장
app.get('/api/naver-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    // 1) 네이버 API 호출
    const { data } = await axios.get(
      'https://openapi.naver.com/v1/search/webkr.json',
      {
        params: { query },
        headers: {
          'X-Naver-Client-Id':     process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
        }
      }
    );

    // 2) 텍스트 변환
    const lines = data.items.map(item => `[${item.title}](${item.link})`);
    const txtContent = lines.join('\n');
    const fileName = `naver-${Date.now()}.txt`;
    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, txtContent, 'utf-8');

    // 3) DB 저장 (파일 경로 전달)
    await saveSearchData('naver', query, filePath);

    console.log(`✅ 네이버 검색 저장 완료: "${query}" → ${fileName}`);
    // 4) 프론트엔드 응답은 원래대로
    res.json(data);
  } catch (err) {
    console.error(`❌ 네이버 API 오류: ${err.message}`);
    res.status(500).json({ error: '네이버 검색 실패' });
  }
});

// 4) YouTube 검색 → 텍스트 파일로 변환 → DB 저장
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });

  try {
    console.log(`🔍 YouTube 검색 요청: "${query}"`);

    // 1) YouTube Data API 호출
    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part:       'snippet',
          q:          query,
          maxResults: 10,
          key:        process.env.YOUTUBE_API_KEY
        }
      }
    );

    // 2) 텍스트 변환
    const lines = data.items.map(item => {
      const vid = item.id.videoId;
      const url = vid ? `https://www.youtube.com/watch?v=${vid}` : '';
      return `${item.snippet.title} → ${url}`;
    });
    const txtContent = lines.join('\n');
    const fileName = `youtube-${Date.now()}.txt`;
    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, txtContent, 'utf-8');

    // 3) DB 저장
    await saveSearchData('youtube', query, filePath);

    console.log(`💾 YouTube 검색 저장 완료: "${query}" → ${fileName}`);
    // 4) 프론트엔드 응답은 원래대로
    res.json(data);
  } catch (err) {
    console.error(`❌ YouTube API 오류: ${err.message}`);
    res.status(500).json({ error: 'YouTube 검색 실패' });
  }
});

// 5) 기존 라우트 연결 유지
app.use('/api', searchRoute);
app.use('/api', weatherRoute);

// 6) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 7) 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
