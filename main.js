/***** 사이트 링크 및 키워드 설정 *****/
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

// 백엔드 API 기본 URL 정의
const API_BASE_URL = 'https://emotionail2-0.onrender.com';

/***** 전역 변수 *****/
document.addEventListener("contextmenu", event => event.preventDefault());
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

/***** 복사 차단 *****/
document.addEventListener("copy", function(e) {
  e.preventDefault();
  let selectedText = window.getSelection().toString();
  e.clipboardData.setData("text/plain", selectedText);
});

/***** 메모리 저장(기억) 및 반복 학습 *****/
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

function updateConversationHistory(input, response) {
  try {
    let history = memoryStorage.load("conversationHistory") || [];
    history.push({ timestamp: Date.now(), input: input, response: response });
    memoryStorage.save("conversationHistory", history);
  } catch(e) {
    console.error("대화 이력 저장 오류:", e);
  }
}

function learnFromInteractions() {
  let history = memoryStorage.load("conversationHistory") || [];
  let emotionCount = memoryStorage.load("emotionCount") || { positive: 0, negative: 0, surprise: 0 };
  if (emotionCount["negative"] && emotionCount["negative"] >= 5) {
    if (!KEYWORDS.negativeComfort) {
      KEYWORDS.negativeComfort = ["힘내세요!", "당신은 혼자가 아니에요.", "괜찮을 거예요."];
    }
  }
}

/***** NLP (감정 분석) + 의도 인식 + 뉴스 파이프라인 *****/
let lastTopic = memoryStorage.load("lastTopic") || "";

async function processNLP(input) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/nlp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input })
    });
    if (!response.ok) throw new Error("NLP 서버 응답 오류");
    const data = await response.json();
    return data.response || null;
  } catch (error) {
    console.error("NLP 처리 오류:", error);
    return "죄송해요, 지금은 대답을 잘 이해하지 못했어요. 다시 말씀해 주세요!";
  }
}

const intents = {
  addEvent: ["일정", "추가", "했어요. 다시 말씀해 주세요!";
  }
}

const intents =예약", {
  add "회의"],
  getWeather: ["날씨", "어때"],
  getTime: ["시간", "몇Event: ["일정", "추가", "예약 시"],
  youtubeSearch: ["유튜브", "youtube", "동영상", "비", "회의디오", "영"],
  getWeather: ["날씨", "어때"],
  getTime: ["시간", "몇 시"],
  youtubeSearch: ["유튜브", "youtube", "동영상", "비디오", "영상"],
 상"],
  naverSearch: naverSearch: [" ["네이버", "naver", "네이버",검색", "찾 "naver", "검색", "찾기"]
};

async function detectIntent(input) {
  try기"]
};

async function detectIntent(input) {
    const response = await {
  try {
    const response = await fetch fetch(`${API_BASE(`${API_BASE_URL}/api/intent`,_URL}/api/intent`, {
      method {
      method: 'POST',
     : 'POST',
      headers: { 'Content-Type': ' headers: {application/json' },
      body: JSON.stringify 'Content-Type': 'application/json({ text: input' },
      body: JSON.stringify({ text })
    });
: input })
    });
    if (!    if (!response.ok)response.ok) throw new Error(" throw new Error의도 인("의도 인식 서버식 서버 응답 오류");
    응답 오류");
    const data = const data = await response.json await response.json();
    return();
    return data.intent || null;
  } catch (error) {
 data.intent || null;
  } catch    console.error("의도 인식 오류:", error);
    return null;
  }
}

function isNewsQuery(input) {
  const newsKeywords = ["뉴스", "속보", "보도", "언론", "이슈", "사 (error) {
    console.error("의도 인식 오류:",건", "정치", "사회", "경제 error);
    return null;
  }
}

function isNewsQuery(input) {
  const newsKeywords = [""];
  return newsKeywords.some(keyword => input.includes(keyword뉴스", "속보", "보도", "));
}

async function pipelineNewsSearch(userInput) {
  const언론", "이슈", "사건", "정치", "사회", "경제"];
  return newsKeywords.some(keyword => input.includes(keyword query = user));
}

async function pipelineNewsSearch(userInput)Input + " news";
  const results = await getNaverSearchResults(query);
  const summary = "뉴스 요약:\n- " {
  const query = userInput + " news";
  const results = await getNaverSearchResults(query);
  const summary = "뉴스 요약:\n- " + results;
  await save + results;
  await saveToLearningToLearningDB('naver', query, results);
  return summary;
}

/***** 음성 출력 *****/
function speakText(text)DB('naver', {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  query, results);
  return summary;
}

/***** 음성 출력 *****/
function speakText(text) {
  const utterance.volume = 1;
  utterance.rate = 1.5;
  utterance.pitch = 1;
  window.speechSynthesis.speak utterance = new SpeechSynthesisUtterance(text);
  utterance(utterance);
}

/***** 캘린더 관련 함수 *****/
function deleteCalendarEvent.lang = "ko-KR";
  utterance.volume = 1;
 (day) {
  const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${day}`);
  if (eventDiv) {
    eventDiv.textContent = "";
    let calendarData = JSON utterance.rate = .parse(localStorage.getItem("calendarEvents") || "{}");
    delete calendarData[`${currentYear}-${currentMonth + 1}-${day}`];
    localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
    return `${currentYear}-${currentMonth + 1}-${day} 일정이 삭제되었습니다.`;
 1.5;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

/*****  } else {
    return "캘린더 관련해당 날짜에 일정이 없습니다.";
  }
}

function getCalendar 함수 *****/
function deleteCalendarEvent(day) {
  const eventDiv = document.getElementById(`Events(dateStr = null) {
  const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
  if (!Object.keys(calendarData).length) {
    return "저장된 일정이 없습니다. 먼저 날짜 셀을 클릭하여 일정을 입력해주세요.";
  }
  if (dateStr) {
    if (calendarData[dateStr]) {
      return `${dateStr}의 일정: ${calendarData[dateStr]}`;
    } elseevent-${currentYear {
      return `${dateStr}-${currentMonth}에는 일정이 없습니다. + 1}-${day}`);
  if (eventDiv) {
    eventDiv.text`;
    }
  } else {
    const currentMonthStrContent = "";
    let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
    delete calendarData[`${currentYear = `${currentYear}-${currentMonth +}-${currentMonth + 1}`;
 1}-${day}`];
    localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
       let events = [];
    for return `${currentYear}-${currentMonth + 1}-${day} 일정이 삭제되었습니다.`;
  } else {
    return "해당 날짜에 일정이 없습니다.";
  }
}

function getCalendarEvents(dateStr = null) {
  const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
  if (!Object.keys(calendarData).length) {
    return "저장된 일정이 없습니다. 먼저 날짜 셀을 클릭하여 일정을 입력해주세요.";
  }
  if (dateStr) {
    if (calendarData[dateStr]) {
      return `${dateStr}의 일정: ${calendarData[dateStr]}`;
    } else {
      return `${dateStr}에는 일정이 없습니다.`;
    }
  } else {
    const currentMonthStr = `${currentYear}-${currentMonth + 1}`;
    let events = [];
    for (let key in calendarData) {
      if (key.startsWith(currentMonthStr)) {
        events.push(`${key}: ${calendarData[key]}`);
      }
    }
    return events.length ? `현재 월(${currentMonthStr})의 (let key in calendarData) {
      if (key.startsWith(currentMonthStr)) {
        events.push(`${key}: ${calendarData[key]}`);
      }
    }
    return events.length ? `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}`
                         : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
  }
}

function updateMap() {
  const englishCity = regionMap[currentCity] || "Seoul";
  const mapIframe = document.getElementById("map-iframe");
  if (mapIframe) {
    mapIframe.src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
  }
}

/***** 백엔드 API 호출 함수 *****/
async function getWeather() {
  try {
    const englishCity = regionMap[currentCity] || "Seoul";
    const response = await fetch(`${API_BASE_URL}/api/weather?city=${encodeURIComponent(englishCity)}`);
    if (!response.ok) throw new Error("서버 응답 오류");
    const data = await response.json();
    currentWeather = data.description;
    const message = `오늘 ${currentCity}의 날씨는 ${data 일정:\n${events.join("\n")}`
                         : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
  }
}

function updateMap() {
  const englishCity = regionMap[currentCity] || "Seoul";
  const mapIframe = document.getElementById("map-iframe");
  if (mapIframe) {
    map.description}이고, 기온은 ${data.temperature}°C입니다.`;
    returnIframe.src = { message };
  } catch (error) {
    console.error(error `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
  }
}

/***** 백엔드 API 호출 함수 *****/
async function getWeather() {
  try {
    const);
    currentWeather = "";
    return { englishCity = message: "날씨 정보를 가져오는데 실패했습니다." };
  }
}

async function getNaverSearchResults(query) {
  try {
    regionMap[currentCity] || "Seoul";
    const response = await fetch(`${API_BASE_URL}/api/weather?city=${encodeURIComponent(englishCity)}`);
    if (!response.ok) throw new const response = await fetch(`${API_BASE Error("서버 응답_URL}/api/naver-search?q=${ 오류");
    const data = await response.json();
    currentWeather = data.description;
    const message = `오늘 ${currentCity}의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
    return { message };
  } catch (error) {
    console.error(error);
    currentWeather = "";
    return { message: "날씨 정보를 가져오는데 실패했습니다." };
  }
}

async function getNaverSearchResults(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/naver-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("서encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("서버 응답 오류");
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => item.title.replace(/<[^>]+>/g, '')).버 응답 오류");
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => item.title.replace(/<[^>]+>/g, '')).join('\n-join('\n- ');
      await saveToLearningDB('naver', query, results);
      return results;
    } else {
      return "검색 결과가 없습니다.";
    }
  } catch (error) {
    console.error(error);
    return "검색 결과를 가져오는데 실패했습니다 ');
      await saveToLearningDB('naver', query, results);
      return results;
    } else {
      return "검색 결과가 없습니다.";
    }
  } catch (error) {
    console.error(error);
    return "검색 결과를 가져오는데 실패했습니다.";
  }
}

async function getYouTubeSearchResults(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/youtube-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("서버 응답 오류.";
  }
}

async function getYouTubeSearchResults(query) {
  try {
    const response");
    const = await fetch(`${API_BASE_URL}/api/youtube-search?q=${encodeURIComponent(query)}`);
    if (! data = await responseresponse.ok) throw new Error("서.json();
    console.log버 응답 오류");
    const data = await response.json();
    console.log('유튜브 백엔드 엔드포인트 API 호출 완료('유튜브 백엔드 엔드포인트 API 호출 완료✅️✅️');
    if');
    if (data.items && data.items.length > 0 (data.items && data.items.length > 0) {
      const results) {
      const results = data.items.map(item => `<a = data.items.map(item => `<a href="${item.url}" target="_blank">${item.title}</ href="${item.url}" target="_blank">${item.title}</a>`).a>`).join('<brjoin('<br>');
      console.log('>');
      console.log('➡️db➡️db.js.js로 이동로 이동하게 하게 ⭕️ server⭕️ server.js로 넘김.js로 넘김니다 성공니다 성공✅✅️');
      await saveToLearning️');
     DB('youtube await saveToLearningDB('youtube', query, data.items);
      return results;
    } else {
      return "검색 결과가 없습니다.";
    }
  } catch (error) {
    console.error(error);
    return', query, data.items);
      return results;
    } else {
      return "검색 결과가 없습니다.";
    }
  } catch (error) {
    console.error(error);
    return "유튜브 검색 결과를 가져오는데 실패했습니다.";
  }
}

/***** 학습용 DB에 저장하는 함수 *****/
async function saveToLearningDB(type, query, results) {
  try {
    const response = await fetch(`${API_BASE "유튜브 검색 결과를 가져오는데 실패했습니다.";
  }
}

/***** 학습용 DB에 저장하는 함수 *****/
async_URL}/api/save-to-db function saveToLearningDB(type, query, results) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save-to-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, query, results })
    });
    if (!response.ok) throw new Error("DB 저장 서버 응답 오류");
`, {
      method:    console.log(`${type} 데이터가 학습용 DB에 저장되었습니다.`);
  } catch (error) {
    console.error("학습용 DB 저장 오류:", error);
  }
}

function updateWeatherEffects() {
  if (!currentWeather || typeof rainGroup === 'undefined' || typeof cloudRainGroup === 'undefined' || typeof houseCloudGroup === 'undefined') return;
  if (currentWeather.includes("비") || currentWeather.includes("소나기")) {
    rainGroup.visible = true;
    cloudRainGroup.visible = true;
  } else {
    rainGroup.visible = false;
    cloudRainGroup.visible = false;
  }
  if (currentWeather.includes("구 'POST',
      headers: { 'Content-Type': 'application/json' },
     름") || currentWeather.includes("흐림")) {
    houseCloudGroup.visible = true;
  } else {
    houseCloudGroup.visible = false;
  }
}

function updateLightning() {
  if (!currentWeather || typeof body: JSON.stringify({ type, query, results })
    });
    if (!response.ok) throw new Error("DB 저장 서버 응답 오류");
    console.log(`${type} 데이터가 학습용 DB에 저장되었습니다.`);
  } catch (error) {
    console.error("학습용 DB 저장 오류:", error);
  }
}

function updateWeatherEffects() {
  if (!currentWeather || typeof rainGroup === 'undefined' || typeof cloudRainGroup === 'undefined' || typeof houseCloudGroup === 'undefined') return;
  if (currentWeather.includes("비") || currentWeather.includes("소나기")) {
    rainGroup.visible = true;
    cloudRainGroup.visible = true lightningLight === 'undefined') return;
  if (currentWeather.includes("번개") || currentWeather.includes("뇌우")) {
    if (Math.random() < 0.001) {
      lightningLight.intensity = 5;
      setTimeout(() => { lightningLight.intensity = 0; }, 100);
    }
  }
}

async function updateWeatherAndEffects(sendMessage = true) {
  const weatherData = await getWeather();
  if (sendMessage) {
    showSpeechBubbleInChunks(weatherData.message);
  }
  updateWeatherEffects();
}

function changeRegion(value) {
  currentCity = value;
  updateMap();
  updateWeatherAndEffects();
  const englishCity = regionMap[currentCity] || "Seoul";
  const message = `지역이 ${currentCity} (${englishCity})로 변경되었습니다.`;
  showSpeechBubbleInChunks(message);
}

/***** 음성 인식 *****/
function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();
  recognition.onresult = function(event) {
    const;
  } else {
    rainGroup.visible = false;
    cloudRainGroup.visible = false;
  }
  if (currentWeather.includes("구름") || currentWeather.includes("흐림")) {
    houseCloudGroup.visible = true;
  } else {
    houseCloudGroup.visible = false;
  }
}

function updateLightning() {
  if (!currentWeather || typeof lightningLight === 'undefined') return;
  if (currentWeather.includes("번개") || currentWeather.includes("뇌우")) {
    if (Math.random() < 0.001) {
      lightningLight.intensity = 5;
      setTimeout(() => { lightningLight.intensity = 0; }, 100 transcript = event.results[0][0].transcript.trim();
    if (confirm(`"${transcript}" 맞나요?);
    }
  }
}

async function updateWeatherAndEffects(sendMessage = true) {
  const weatherData = await getWeather();
  if (sendMessage) {
    showSpeechBubbleInChunks(weatherData.message);
  }
  updateWeather`)) {
      constEffects();
}

function change chatInput = document.getElementRegion(value) {
  currentCity = value;
  updateMap();
  updateWeatherAndEffects();
  const englishById("chat-inputCity = regionMap[currentCity] || "Seoul";
  const message = `지역이 ${currentCity} (${englishCity})로 변경되었습니다.`;
  showSpeechBubbleInChunks(message);
}

/***** 음성 인식 ****");
      if (chat*/
function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();
Input) {
        chat  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.trim();
    if (confirm(`"${transcript}" 맞나요?`)) {
      const chatInput = document.getElementById("chat-input");
      if (chatInput.value = transcriptInput) {
        chatInput.value = transcript;
        sendChat();
      }
    }
  };
  recognition.onerror = function(event) {
    console.error;
        sendChat();
      }
    }
  };
  recognition.onerror = function(event) {
    console.error("음("음성 인식 오류성 인식 오류:", event.error);
  };
:", event.error);
  };
}

/***** 대}

/***** 대화 화 맥맥락 유지락 유지 및 의 및 의도 인식 *****/
function도 인식 *****/
function updateContext updateContext(intent(intent) {
  lastTopic = intent) {
  lastTopic = intent;
  memoryStorage.save;
  memoryStorage.save("lastTopic", lastTopic);
}

/*****("lastTopic", lastTopic);
}

/***** 채팅 전송 채팅 전송 및 파이프 및 파이프라인 처리 *****/
async라인 처리 *****/
async function sendChat() {
  function sendChat() {
  const const inputEl = document.getElementById inputEl = document.getElementById("chat-input");
  if("chat-input");
  if (!inputEl) return;
  const input (!inputEl) return;
  const input = inputEl.value.trim();
  if (!input) return;
  let response = "";
  let isHTML = = inputEl.value.trim();
  if (!input) return;
  let response = "";
  let isHTML = false;
  let should false;
  let shouldNavigate = false;
  let navigateNavigate = false;
  let navigateUrl = "";
  const lowerInput = input.toLowerUrl = "";
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("일정 알려") || lowerInput.includes("일정 뭐Case();

  if (lowerInput.includes("일정 알려") || lowerInput.includes("일정 뭐") || lowerInput.includes") || lowerInput.includes("일("일정 보여정 보여")) {
   ")) {
    const dateMatch const dateMatch = input = input.match(/\d.match(/\d{4}-\d{4}-\d{1,{1,2}-\d{1,2}/2}-\d{1,2}/);
    response);
    response = dateMatch ? = dateMatch ? getCalendar getCalendarEvents(dateMatch[0]) : getCalendarEvents();
  } else if (isNewsEvents(dateMatch[0]) : getCalendarEvents();
  } else if (isNewsQuery(input)) {
    responseQuery(input)) {
    response = await pipeline = await pipelineNewsSearch(input);
  }NewsSearch(input);
  } else {
    for else {
    for (let site (let site in SITE_LINKS) {
      if ( in SITE_LINKS) {
      if (lowerInput.includes(sitelowerInput.includes(site)) {
        if)) {
        if (site === "유튜브" || site === "youtube") {
          const query = lowerInput (site === "유튜브" || site === "youtube") {
          const query = lowerInput.replace(new RegExp(intents.youtubeSearch.join("|"), "gi"), "").trim();
          if (query) {
            response = await getYouTubeSearchResults(query);
            isHTML = true;
          }.replace(new RegExp(intents.youtubeSearch.join("|"), "gi"), "").trim();
          if (query) {
            response = await getYouTubeSearchResults(query);
            isHTML = true;
          } else {
            response else {
            response = "유튜브 검색 = "유튜브 검색어를 입력어를 입력해주세요.해주세요. 예: 고 예: 고양이 비디오";
양이 비디오";
          }
                   }
          updateContext("youtube updateContext("youtubeSearch");
        } else ifSearch");
        } else if (site === "네 (site === "네이버이버" || site" || site === "nav === "naver") {
          conster") {
          const query = lower query = lowerInput.replace(new RegExp(intInput.replace(new RegExp(intents.naverents.naverSearch.joinSearch.join("|"), "gi("|"), "gi"), "")."), "").trim();
          if (querytrim();
          if (query) {
            const naverResults = await getNaverSearchResults(query) {
            const naverResults = await getNaver);
            response = navSearchResults(query);
            response = naverResults ? `erResults ? `검색 결과:\n- ${naverResults}` : "검색 결과를 가져오는데 실패했습니다.";
          } else {
            response = "검색어를 입력해주세요. 예: 네이버 날씨";
          }
          updateContext("naverSearch");
        } else검색 결과:\n- ${naverResults}` : "검색 결과를 가져오는데 실패했습니다.";
          } else {
            response = "검색어를 입력해주세요. 예: 네이버 날씨";
          }
          updateContext("naverSearch");
        } else {
          response {
          response = `${ = `${site} 사이트site} 사이트로 이동로 이동합니다!합니다! 잠 잠시만시만 기다려 기다려 주세요.`;
 주세요.`;
          should          shouldNavigate = true;
          navigateNavigate = true;
          navigateUrl = SITE_LINKS[Url = SITE_LINKS[site];
        }
       site];
        }
        break;
      }
 break;
      }
    }

    if (!response)    }

    if (!response) {
      const nlpResponse = await processNLP {
      const nlpResponse = await processNLP(input);
      if(input);
      if (nlp (nlpResponse) {
        response =Response) {
        response = nlpResponse;
      } nlpResponse;
      } else {
        const intent else {
        const intent = await detect = await detectIntent(input);
        ifIntent(input);
        if (intent === "add (intent === "addEvent") {
          const eventMatch = inputEvent") {
          const eventMatch = input.match(/(.match(/(오오늘|내늘|내일|\일|\d{4d{4}-\d{1,2}-\d{1,2})\s*(\d{1,2})시/);
          if (eventMatch) {
            let date;
            if (eventMatch[1}-\d{1,2}-\d{1,2})\s*(\d{1,2})시/);
          if (eventMatch) {
            let date;
            if (eventMatch[1] === "오늘")] === "오늘") {
              date = new Date {
              date = new Date();
            } else if (eventMatch[1] === "내일") {
              date = new Date(Date();
            } else if (eventMatch[1] === "내일") {
              date = new Date(Date.now() + 864.now() + 86400000);
            } else {
              date = new Date(eventMatch[1]);
            }
            date.setHours(parseInt(eventMatch[2]));
            const eventText = input.replace(eventMatch[0], "").trim();
            const00000);
            } else {
              date = new Date(eventMatch[1]);
            }
            date.setHours(parseInt(eventMatch[2]));
            const eventText = input.replace(eventMatch[0], "").trim();
            const dateKey = `${date dateKey = `${date.getFullYear()}-${date.getFullYear()}-${date.getMonth() + 1.getMonth() + 1}-${date.getDate()}`;
}-${date.getDate()}`;
            let            let calendarData = JSON.parse(localStorage.getItem("calendarEvents calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
            calendarData[dateKey] = eventText;
            localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
            renderCalendar(currentYear, currentMonth);
            response = `${dateKey}에") || "{}");
            calendarData[dateKey] = eventText;
            localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
            renderCalendar(currentYear, currentMonth);
            response = `${dateKey}에 "${eventText}" 일정이 추가되었습니다.`;
            updateContext("addEvent");
          }
        } else if (intent === "getWeather") {
          const "${eventText}" 일정이 추가되었습니다.`;
            updateContext("addEvent");
          }
        } else if (intent === "getWeather") {
          const weatherData = await getWeather();
          response = weatherData.message;
          updateContext("weather");
        } else if (intent === "getTime") {
          const weatherData = await getWeather();
          response = weatherData.message;
          updateContext("weather");
        } else if (intent === "getTime") {
          const now = new Date();
          now = new Date();
          response = ` response = `현재 시간현재 시간은 ${now.getHours은 ${now.getHours()}시()}시 ${now.get ${now.getMinutes()}분입니다Minutes()}분입니다.`;
          update.`;
          updateContext("time");
        } else ifContext("time");
        } else if (intent (intent === "youtube === "youtubeSearch") {
Search") {
          const query = lowerInput          const query = lower.replace(new RegExp(intInput.replace(new RegExp(intents.youtubeents.youtubeSearch.join("|Search.join("|"), "gi"), "gi"), "").trim();
          if (query) {
            response = await getYouTubeSearchResults(query);
            isHTML = true;
          } else {
            response = ""), "").trim();
          if (query) {
            response = await getYouTubeSearchResults(query);
            isHTML = true;
          } else {
            response = "유유튜브 검색어를튜브 검색어를 입력해주세요. 입력해주세요. 예: 고양이 비디오";
          }
          updateContext("youtubeSearch");
        } else if (intent === "naverSearch") {
          const 예: 고양이 비디오";
          }
          updateContext("youtubeSearch");
        } else if (intent === "naverSearch") {
          const query = lower query = lowerInput.replace(new RegExp(intents.naverSearch.join("|"), "gi"), "").trim();
          if (queryInput.replace(new RegExp(intents.naverSearch.join("|"), "gi"), "").trim();
          if (query) {
            const nav) {
            const naverResults = await getNaverResults = await getNaverSearchResults(query);
           erSearchResults(query);
            response = naverResults ? ` response = naverResults ? `검검색 결과:\색 결과:\n-n- ${naverResults ${naverResults}` : "}` : "검색 결과를 가져오는데검색 결과를 가져오는데 실패했습니다 실패했습니다.";
            update.";
            updateContext("navContext("naverSearch");
          } else {
            response = "네이버 검색어를 입력해주세요. 예: 네erSearch");
          } else {
            response = "네이버 검색어를 입력해주세요. 예: 네이버 날이버 날씨";
          }
        }씨";
          }
        } else if (last else if (lastTopic === "weatherTopic === "weather" && lower" && lowerInput.includes("Input.includes("내일")) {
          response = "내일 날씨는 비가 올 예정입니다.";
        } else if (lowerInput.startsWith("지역 ")) {
          const newCity = lowerInput.replace("지역", "").trim();
          if (newCity && regionList.includes(newCity)) {
            currentCity = newCity내일"));
            const regionSelect = document.getElementById("region-select");
            if (regionSelect) regionSelect.value = newCity;
            response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
            updateMap();
            await updateWeatherAndEffects();
          } else {
            response = "죄송해요, 그 지역은 지원하지 않아요. 드롭다운 메뉴에서 {
          response = "내일 날씨는 비가 올 예정입니다.";
        } else if (lowerInput.startsWith("지역 ")) {
          const newCity = lowerInput.replace("지역", "").trim();
          if (newCity && regionList.includes(newCity)) {
            currentCity = newCity;
            const regionSelect = document.getElementById("region-select");
            if (regionSelect) regionSelect.value = newCity;
            response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
            updateMap();
            선택해주세요.";
          }
        } else if (regionList.includes(input)) {
          currentCity = input;
          const regionSelect = document.getElementById("region-select");
          if (regionSelect) regionSelect.value = input;
          response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
          updateMap();
          await updateWeatherAndEffects();
        } else if (KEYWORDS.delete.some(keyword => lowerInput.includes(keyword))) {
          const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
          await updateWeatherAndEffects();
          } else {
            response = "죄송해요, 그 지역은 지원하지 않아요. if (dayStr) {
            const dayNum = parseInt(dayStr);
            response = deleteCalendarEvent(dayNum);
          } else {
            response = "삭제할 날짜를 입력하지 않으셨습니다.";
          }
        } else if (KEYWORDS.greetings.some(keyword => lowerInput.includes(keyword))) {
          response = "안녕하세요! 만나서 반갑습니다. 오늘 하루 어떠셨나요?";
        } else if (KEYWORDS 드롭다운 메뉴에서 선택해주세요.";
          }
        } else if (regionList.includes(input)) {
          currentCity = input;
         .sleep.some(keyword => lowerInput.includes(keyword))) {
          response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
        } else if (KEYWORDS.weather.some(keyword => lowerInput.includes(keyword))) {
          const weatherData = await getWeather();
          response = weatherData.message;
        } else if (lowerInput.includes("시간")) {
          const now = new Date();
          response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
        } else {
          const generalResponses = [
            "정말 흥미로운 이야기네요. 더 들려주세요!",
            "알겠습니다. 혹시 다른 궁금한 점은 없으신가요?",
            "그렇군요. 당신의 의견을 듣고 있으니 따뜻한 대화를 나눠요.",
            "그렇게 느끼실 수 있겠네요. 함께 이야기 나눠 const regionSelect = document.getElementById("region-select");
          if (regionSelect) regionSelect.value = input;
          response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
          updateMap();
          await updateWeatherAndEffects();
        } else if (KEYWORDS.delete봐요!"
          ];
          response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
        }
      }
    }
  }

  showSpeechBubbleInChunks(response, isHTML);

  if (shouldNavigate) {
    setTimeout(() => { window.location.href = navigateUrl; }, 2000);
  }

  input.some(keyword => lowerInput.includes(keyword))) {
          const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
          if (dayStr) {
            const dayNum = parseInt(dayStr);
            response = deleteCalendarEvent(dayNum);
          } else {
            response = "삭제할 날짜를 입력하지 않으셨습니다.";
          }
        } else if (KEYWORDS.greetings.some(keyword => lowerInput.includes(keyword))) {
          response = "안녕하세요! 만나서 반갑습니다. 오늘 하루 어떠셨나요?";
        } else if (KEYWORDS.sleep.some(keyword => lowerInput.includes(keyword))) {
          response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
        } else if (KEYWORDS.weather.some(keyword => lowerInput.includes(keyword))) {
          const weatherData = await getWeather();
          response = weatherData.message;
        } else if (lowerInput.includes("시간")) {
          const now = new Date();
          response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
        } else {
          const generalResponses = [
            "정말 흥미로운 이야기네요. 더 들려주세요!",
            "알겠습니다. 혹시 다른 궁금한 점은 없으신가요?",
            "그렇군요. 당신의 의견을 듣고 있으니 따뜻한 대화를 나눠요.",
            "그렇게 느끼실 수 있겠네요. 함께 이야기 나눠봐요!"
          ];
          response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
        }
      }
    }
  }

  showSpeechBubbleInChunks(response, isHTML);

  if (shouldNavigate) {
    setTimeout(() => { window.location.href = navigateUrl; }, 2000);
  }

  inputEl.value = "";
  memoryStorage.save('lastInput', input);
  memoryStorage.save('lastResponse', response);
  updateConversationHistory(input, response);
  learnFromInteractions();
}

/***** 말풍선(버블) 여러 줄 출력 *****/
function showSpeechBubbleInChunks(text, isHTML = false, chunkSize = 15, delay = 1500) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) return;
  let parts;
  if (isHTML) {
    parts = text.split("<br>");
  } else {
    parts = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      parts.push(text.slice(i, i + chunkSize));
    }
  }
  let index = 0;
  bubble.innerHTML = "";
  function showNextPart() {
    if (index < parts.length) {
      if (isHTML) {
        bubble.innerHTML += parts[index] + "<br>";
        const tempDiv = document.createEl.value = "";
  memoryStorage.save('lastInput', input);
  memoryStorage.save('lastResponse', response);
  updateConversationHistory(input, response);
  learnFromInteractions();
}

/***** 말풍선(버블) 여러 줄 출력 *****/
function showSpeechBubbleInChunks(text, isHTML = false, chunkSize = 15, delay =Element("div");
        tempDiv.innerHTML = parts[index];
        speakText(tempDiv.textContent);
      } else {
        bubble.textContent += parts[index];
        speakText(parts[index]);
      }
      bubble.style.display = "block";
      index 1500) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) return;
  let parts;
  if (isHTML) {
    parts = text.split("<br>");
  } else {
    parts = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      parts.push(text.slice(i, i + chunkSize));
    }
  }
  let index = 0;
  bubble.innerHTML = "";
  function showNextPart() {
    if (index < parts.length) {
      if (isHTML) {
        bubble.innerHTML += parts[index] +++;
      setTimeout(showNextPart, delay);
    } else {
      setTimeout(() => { bubble.style.display = "none"; }, 3000);
    }
  }
  showNextPart();
}

/***** DOMContentLoaded, resize, load 이벤트 *****/
window.addEventListener("DOMContentLoaded", function() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.setAttribute("list", "Charge");
    chatInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendChat();
    });
  }
  const autoCompleteList = document.createElement("datalist");
  autoCompleteList.id = "Charge";
  const allKeywords = Object.values(KEYWORDS).flat().concat(Object.keys(SITE_LINKS));
  allKeywords.for "<br>";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = parts[index];
        speakEach(kw => {
    const option = document.createElement("option");
    option.value = kw;
    autoCompleteList.appendChild(option);
  });
  document.body.appendChild(autoCompleteList);

  const regionSelect = document.getElementById("region-select");
  if (regionSelect) {
    regionList.forEach(region => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = `${region} (${regionMap[region]})`;
      if (region === currentCity) option.selected = true;
      regionSelect.appendChild(option);
    });
  }
});

window.addEventListener("resize", function() {
  if (typeof camera !== 'undefined' && typeof renderer !== 'undefined') {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

window.addEventListener("load", async () => {
  initCalendar();
  updateMap();
  await updateWeatherAndEffects();

  // MongoDB 데이터 가져오기 및 표시
  async function fetchAndDisplayData() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getData`);
      if (!response.ok) throw new Error("데이터 가져오기 실패");
      const dbData = await response.json(); // Array of docs

      // 서버에서 자모음 결합된 데이터를 반환한다고 가정
      const lines = dbData.flatMap(doc => doc.results);

      // 화면에 출력
      const dataDisplay = document.getElementById("data-display");
      if (!dataDisplay) {
        console.error("data-display 요소를 찾을 수 없습니다.");
        return;
      }
      dataDisplay.innerHTML = lines.join('<br>');

      console.log('몽고 API 호출 성공😃');
    } catch (error) {
      console.error("데이터 가져오기 오류:", error);
      alert("데이터를 가져오는데 실패했습니다. 다시 시도해주세요.");
    }
  }

  fetchAndDisplayData();
});

/***** 캘린더 렌더링 *****/
let currentYear, currentMonth;
function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  populateYearSelect();
  renderCalendar(currentYear, currentMonth);

  const prevMonth = document.getElementById("prev-month");
  const nextMonth = document.getElementById("next-month");
  const yearSelect = document.getElementById("year-select");
  const deleteDayEvent = document.getElementById("delete-day-event");

  if (prevMonth) {
    prevMonth.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (nextMonth) {
    nextMonth.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (yearSelect) {
    yearSelect.addEventListener("change", (e) => {
      currentYear = parseInt(e.target.value);
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (deleteDayEvent) {
    deleteDayEvent.addEventText(tempDiv.textContent);
      } else {
        bubble.textContent += parts[index];
        speakText(parts[index]);
      }
      bubble.style.display = "block";
      index++;
      setTimeout(showNextPart, delay);
    } else {
      setTimeout(() => { bubble.style.display = "none"; }, 3000);
    }
  }
  showNextPart();
}

/***** DOMContentLoaded, resize, load 이벤트 *****/
window.addEventListener("DOMContentLoaded", function() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.setAttribute("list", "Charge");
    chatInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendChat();
    });
  }
  const autoCompleteList = document.createElement("datalist");
  autoCompleteList.id = "Charge";
  const allKeywords = Object.values(KEYWORDS).flat().concat(Object.keys(SITE_LINKS));
  allKeywords.forEach(kw => {
    const option = document.createElement("option");
    option.value = kw;
    autoCompleteList.appendChild(option);
  });
  document.body.appendChild(autoCompleteList);

  const regionSelect = document.getElementById("region-select");
  if (regionSelect) {
    regionList.forEach(region => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = `${region} (${regionMap[region]})`;
      if (region === currentCity) option.selected = true;
      regionSelect.appendChild(option);
    });
  }
});

window.addEventListener("resize", function() {
  if (typeof camera !== 'undefined' && typeof renderer !== 'undefined') {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

window.addEventListener("load", async () => {
  initCalendar();
  updateMap();
  await updateWeatherAndEffects();

  // MongoDB 데이터 가져오기 및 표시
  async function fetchAndDisplayData() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getData`);
      if (!response.ok) throw new Error("데이터 가져오기 실패");
      const dbData = await response.json(); // Array of docs

      // 서버에서 자모음 결합된 데이터를 반환한다고 가정
      const lines = dbData.flatMap(doc => doc.results);

      // 화면에 출력
      const dataDisplay = document.getElementById("data-display");
      if (!dataDisplay) {
        console.error("data-display 요소를 찾을 수 없습니다.");
        return;
      }
      dataDisplay.innerHTML = lines.join('<br>');

      console.log('몽고 API 호출 성공😃');
    } catch (error) {
      console.error("데이터 가져오기 오류:", error);
      alert("데이터를 가져오는데 실패했습니다. 다시 시도해주세요.");
    }
  }

  fetchAndDisplayData();
});

/***** 캘린더 렌더링 *****/
let currentYear, currentMonth;
function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
 Listener("click", () => {
      const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
      if (dayStr) {
        const dayNum = parseInt(dayStr);
        const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${dayNum}`);
        if (eventDiv) {
          eventDiv.textContent = "";
