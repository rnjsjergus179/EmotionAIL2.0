"scripts": {
  "start": "node server.js"
}
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors'); // CORS를 허용하기 위해

// .env 파일에서 환경 변수 로드
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS 설정: GitHub Pages 도메인을 허용
app.use(cors({
  origin: 'http://emotionail.site/', // 실제 GitHub Pages 도메인으로 교체
}));

// /api/weather 엔드포인트: 도시 이름을 받아 날씨 정보 반환
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }
  try {
    const weatherKey = process.env.WEATHER_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherKey}&units=metric&lang=kr`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// /api/search 엔드포인트: 검색어를 받아 Google 검색 결과 반환
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleCseId = process.env.GOOGLE_CSE_ID;
    const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
