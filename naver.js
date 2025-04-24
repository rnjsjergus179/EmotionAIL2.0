// naver.js

const fetch = require('node-fetch'); // fetch 모듈 필요 (설치: npm install node-fetch)

// 네이버 API 설정 (환경 변수에서 키 가져옴)
const NAVER_API = {
  clientId: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  baseUrl: 'https://openapi.naver.com/v1/search/webkr.json' // 웹 검색 API
};

/**
 * 네이버 검색 API 호출 함수
 * @param {string} query - 검색어
 * @returns {Promise<object>} - 검색 결과 반환
 */
async function searchNaver(query) {
  try {
    const response = await fetch(`${NAVER_API.baseUrl}?query=${encodeURIComponent(query)}&display=5&start=1`, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER_API.clientId,
        'X-Naver-Client-Secret': NAVER_API.clientSecret,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`네이버 API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("네이버 검색 오류:", error);
    throw error;
  }
}

module.exports = { searchNaver };
