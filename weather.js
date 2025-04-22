const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const WEATHER_KEY = process.env.WEATHER_KEY;

router.get('/weather', async (req, res) => {
  const city = req.query.city || 'Seoul';
  try {
    if (!WEATHER_KEY) {
      return res.status(500).json({ error: '날씨 API 키가 설정되지 않았습니다.' });
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=metric&lang=ko`;
    const response = await axios.get(url);
    const data = response.data;
    const weather = {
      city: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity
    };
    res.json(weather);
  } catch (error) {
    console.error('날씨 조회 오류:', error);
    res.status(500).json({ error: '날씨 정보를 가져오지 못했습니다.' });
  }
});

module.exports = router;
