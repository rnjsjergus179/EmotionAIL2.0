const API_BASE_URL = 'https://emotionail2-0.onrender.com';

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

async function fetchAndUpdateKeywords(KEYWORDS, intentWeightMatrix) {
  try {
    await logToServer("MongoDB 데이터 가져오기 시작");
    const response = await fetch(`${API_BASE_URL}/api/processed-data?limit=100`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("응답 데이터가 배열이 아님");

    data.forEach(item => {
      const intent = item.intent;
      const keywords = item.keywords.map(kw => kw.trim().toLowerCase()).slice(0, 50);
      if (KEYWORDS[intent]) {
        KEYWORDS[intent] = [...new Set([...KEYWORDS[intent], ...keywords])];
      } else {
        KEYWORDS[intent] = [...new Set(keywords)];
        intentWeightMatrix[intent] = Array(300).fill(0.01);
      }
    });

    await logToServer("의도인식 그룹객체에 업데이트 완료");
    return Object.values(KEYWORDS).flat().join(" ");
  } catch (error) {
    await logToServer(`MongoDB API 호출 실패: ${error.message}`);
    console.error("MongoDB 데이터 가져오기 실패:", error);
    return "";
  }
}

async function getEmbedding(text) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const { embedding } = await response.json();
    return embedding || Array(300).fill(0);
  } catch (error) {
    console.error("임베딩 API 호출 실패:", error);
    return Array(300).fill(0);
  }
}

async function getWeather(currentCity) {
  try {
    const position = await getUserLocation();
    const { latitude, longitude } = position;
    const response = await fetch(`${API_BASE_URL}/api/weather?lat=${latitude}&lon=${longitude}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    const currentWeather = data.description;
    const message = `현재 위치의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
    await logToServer("날씨 API 호출 성공");
    return { message, currentWeather };
  } catch (error) {
    await logToServer(`날씨 API 호출 실패: ${error.message}`);
    const regionMap = {
      "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
      "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
      "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
      "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
      "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
    };
    const englishCity = regionMap[currentCity] || "Seoul";
    const response = await fetch(`${API_BASE_URL}/api/weather?city=${encodeURIComponent(englishCity)}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    const currentWeather = data.description;
    const message = `오늘 ${currentCity}의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
    return { message, currentWeather };
  }
}

async function getNaverSearchResults(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/naver-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => item.title.replace(/<[^>]+>/g, '')).join('\n- ');
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

async function getYouTubeSearchResults(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/youtube-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => `<a href="${item.url}" target="_blank">${item.title}</a>`).join('<br>');
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

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        resolve(position.coords);
      }, error => {
        reject(error);
      });
    } else {
      reject("Geolocation is not supported by this browser.");
    }
  });
}

export {
  logToServer, fetchAndUpdateKeywords, getEmbedding, getWeather,
  getNaverSearchResults, getYouTubeSearchResults, saveToLearningDB, getUserLocation
};
