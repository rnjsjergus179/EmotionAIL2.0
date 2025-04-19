// 사이트 링크 및 키워드 설정
const SITE_LINKS = {
  "빙": "https://www.bing.com",
  "네이버": "https://www.naver.com",
  "다음": "https://www.daum.net",
  "유튜브": "https://www.youtube.com",
  "넷플릭스": "https://www.netflix.com",
  "트위치": "https://www.twitch.tv",
  "틱톡": "https://www.tiktok.com",
  "인스타": "https://www.instagram.com",
  "인스타그램": "https://www.instagram.com",
  "페이스북": "https://www.facebook.com",
  "트위터": "https://x.com",
  "엑스": "https://x.com",
  "링크드인": "https://www.linkedin.com",
  "레딧": "https://www.reddit.com"
};

const KEYWORDS = {
  greetings: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네"],
  sleep: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
  weather: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
  calendar: ["일정 알려줘"],
  time: ["시간 알려줘"],
  delete: ["하루일정 삭제", "하루일과 삭제해줘", "하루일과", "하루일저", "하루 일관"]
};

// 전역 변수
let currentCity = "서울";
let currentWeather = "";
const regionMap = {
  "서울": "Seoul",
  "인천": "Incheon",
  "수원": "Suwon",
  "고양": "Goyang",
  "성남": "Seongnam",
  "용인": "Yongin",
  "부천": "Bucheon",
  "안양": "Anyang",
  "의정부": "Uijeongbu",
  "광명": "Gwangmyeong",
  "안산": "Ansan",
  "파주": "Paju",
  "부산": "Busan",
  "대구": "Daegu",
  "광주": "Gwangju",
  "대전": "Daejeon",
  "울산": "Ulsan",
  "제주": "Jeju",
  "전주": "Jeonju",
  "청주": "Cheongju",
  "포항": "Pohang",
  "여수": "Yeosu",
  "김해": "Gimhae"
};
const regionList = Object.keys(regionMap);

// 메모리 저장 (localStorage 사용)
const memoryStorage = {
  save: function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  load: function(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch(e) {
      console.error("Error loading key:", key, e);
      return null;
    }
  }
};

// 날씨 API 호출 (백엔드 통합)
async function getWeather() {
  try {
    const englishCity = regionMap[currentCity] || "Seoul";
    const url = `https://emotionail2-0.onrender.com/api/weather?city=${encodeURIComponent(englishCity)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("날씨 API 호출 실패");
    const data = await res.json();
    currentWeather = data.weather[0].description;
    const message = `오늘 ${currentCity}의 날씨는 ${data.weather[0].description}이고, 기온은 ${data.main.temp}°C입니다.`;
    return { message };
  } catch (error) {
    console.error(error);
    currentWeather = "";
    return { message: "날씨 정보를 가져오는데 실패했습니다." };
  }
}

// 구글 검색 API 호출 (백엔드 통합)
async function getGoogleSearchResults(query) {
  const url = `https://emotionail2-0.onrender.com/api/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("구글 검색 API 호출 실패");
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      return data.items.map(item => item.title).join(", ");
    } else {
      return "검색 결과가 없습니다.";
    }
  } catch (error) {
    console.error(error);
    return "검색 결과를 가져오는데 실패했습니다.";
  }
}

// 말풍선 출력
function showSpeechBubbleInChunks(text, chunkSize = 15, delay = 1500) {
  const bubble = document.getElementById("speech-bubble");
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  let index = 0;
  function showNextChunk() {
    if (index < chunks.length) {
      bubble.textContent = chunks[index];
      bubble.style.display = "block";
      index++;
      setTimeout(showNextChunk, delay);
    } else {
      setTimeout(() => { bubble.style.display = "none"; }, 3000);
    }
  }
  showNextChunk();
}

// 채팅 전송 및 처리
async function sendChat() {
  const inputEl = document.getElementById("chat-input");
  const input = inputEl.value.trim();
  if (!input) return;
  let response = "";
  const lowerInput = input.toLowerCase();

  // 사이트 이동 처리
  for (let site in SITE_LINKS) {
    if (lowerInput.includes(site)) {
      response = `${site} 사이트로 이동합니다! 잠시만 기다려 주세요.`;
      showSpeechBubbleInChunks(response);
      setTimeout(() => { window.location.href = SITE_LINKS[site]; }, 2000);
      inputEl.value = "";
      return;
    }
  }

  // 키워드 기반 응답
  if (KEYWORDS.greetings.some(keyword => lowerInput.includes(keyword))) {
    response = "안녕하세요! 만나서 반갑습니다.";
  } else if (KEYWORDS.sleep.some(keyword => lowerInput.includes(keyword))) {
    response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
  } else if (KEYWORDS.weather.some(keyword => lowerInput.includes(keyword))) {
    const weatherData = await getWeather();
    response = weatherData.message;
  } else if (lowerInput.includes("시간")) {
    const now = new Date();
    response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
  } else if (lowerInput.startsWith("구글 ")) {
    const query = input.replace("구글 ", "").trim();
    if (query) {
      const searchResults = await getGoogleSearchResults(query);
      response = searchResults ? `구글 검색 결과: ${searchResults}` : "검색 결과를 가져오는데 실패했습니다.";
    } else {
      response = "검색어를 입력해주세요. 예: 구글 날씨";
    }
  } else if (regionList.includes(input)) {
    currentCity = input;
    document.getElementById("region-select").value = input;
    response = `지역을 ${input}(으)로 변경했습니다.`;
    const weatherData = await getWeather();
    response += `\n${weatherData.message}`;
  } else {
    response = "알겠습니다. 더 궁금한 점이 있으면 말씀해주세요!";
  }

  memoryStorage.save('lastInput', input);
  memoryStorage.save('lastResponse', response);
  showSpeechBubbleInChunks(response);
  inputEl.value = "";
}

// 이벤트 리스너 설정
window.addEventListener("DOMContentLoaded", function() {
  document.getElementById("chat-input").addEventListener("keydown", function(e) {
    if (e.key === "Enter") sendChat();
  });
  const regionSelect = document.getElementById("region-select");
  regionList.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = `${region} (${regionMap[region]})`;
    if (region === currentCity) option.selected = true;
    regionSelect.appendChild(option);
  });
  regionSelect.addEventListener("change", function() {
    currentCity = this.value;
    sendChat(); // 지역 변경 시 날씨 업데이트
  });
});
