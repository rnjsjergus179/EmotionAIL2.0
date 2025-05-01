// search.js

// API 기본 URL (실제 환경에 맞게 설정 필요)
const API_BASE_URL = 'https://emotionail2-0.onrender.com';

// API 호출 결과를 캐싱하기 위한 객체
const apiCache = {};

// 서버에 로그를 남기는 함수
async function logToServer(message) {
  try {
    await fetch(`${API_BASE_URL}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
  } catch (error) {
    console.error("서버 로깅 실패:", error.message);
  }
}

// 학습용 DB에 데이터를 저장하는 함수
async function saveToLearningDB(type, query, results) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save-to-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, query, results })
    });
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    await logToServer(`${type} 데이터가 학습용 DB에 저장되었습니다.`);
  } catch (error) {
    await logToServer(`학습용 DB 저장 오류: ${error.message}`);
  }
}

// 네이버 검색 결과를 가져오는 함수
async function getNaverSearchResults(query) {
  const cacheKey = `naver_${query}`;
  if (apiCache[cacheKey]) {
    console.log("캐시된 네이버 검색 결과 반환");
    return apiCache[cacheKey];
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/naver-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => item.title.replace(/<[^>]+>/g, '')).join('\n- ');
      apiCache[cacheKey] = results;
      await saveToLearningDB('naver', query, results);
      await logToServer("네이버 검색 API 호출 성공");
      return results;
    } else {
      return "검색 결과가 없습니다.";
    }
  } catch (error) {
    await logToServer(`네이버 검색 API 호출 실패: ${error.message}`);
    return "검색 결과를 가져오는데 실패했습니다.";
  }
}

// 유튜브 검색 결과를 가져오는 함수
async function getYouTubeSearchResults(query) {
  const cacheKey = `youtube_${query}`;
  if (apiCache[cacheKey]) {
    console.log("캐시된 유튜브 검색 결과 반환");
    return apiCache[cacheKey];
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/youtube-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => `<a href="${item.url}" target="_blank">${item.title}</a>`).join('<br>');
      apiCache[cacheKey] = results;
      await saveToLearningDB('youtube', query, data.items);
      await logToServer("유튜브 검색 API 호출 성공");
      return results;
    } else {
      return "검색 결과가 없습니다.";
    }
  } catch (error) {
    await logToServer(`유튜브 검색 API 호출 실패: ${error.message}`);
    return "유튜브 검색 결과를 가져오는데 실패했습니다.";
  }
}

// 페이지 로드 시 초기화 메시지
console.log("search.js loaded.");
