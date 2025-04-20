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

let GOOGLE_API_KEY = "AIzaSyCI2i_sju-YieGbWgEi-mMG2ISF_HbL5wI";
let GOOGLE_CSE_ID = "a3af6d0ed6e9641da";
let weatherKey = "2caa7fa4a66f2f8d150f1da93d306261";

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

/***** 복사 차단 및 API 키 숨김 *****/
document.addEventListener("copy", function(e) {
  e.preventDefault();
  let selectedText = window.getSelection().toString();
  selectedText = selectedText.replace(/AIzaSyCI2i_sju-YieGbWgEi-mMG2ISF_HbL5wI/g, "HIDDEN");
  selectedText = selectedText.replace(/a3af6d0ed6e9641da/g, "HIDDEN");
  selectedText = selectedText.replace(/2caa7fa4a66f2f8d150f1da93d306261/g, "HIDDEN");
  e.clipboardData.setData("text/plain", selectedText);
  showSpeechBubbleInChunks("API 키가 숨겨졌습니다.");
});

/***** 메모리 저장 및 학습 *****/
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

/***** NLP 및 의도 인식 *****/
let lastTopic = memoryStorage.load("lastTopic") || "";
function processNLP(input) {
  const lowerInput = input.toLowerCase();
  const emotions = {
    positive: ["좋아", "행복", "기쁘", "즐거", "최고"],
    negative: ["슬프", "우울", "짜증", "화나", "피곤"],
    surprise: ["놀라", "대박", "와"]
  };
  let detectedEmotion = null;
  for (let mood in emotions) {
    if (emotions[mood].some(keyword => lowerInput.includes(keyword))) {
      detectedEmotion = mood;
      break;
    }
  }
  if (input.trim().match(/!$/)) detectedEmotion = "surprise";
  let emotionCount = memoryStorage.load("emotionCount") || { positive: 0, negative: 0, surprise: 0 };
  if (detectedEmotion) {
    emotionCount[detectedEmotion] = (emotionCount[detectedEmotion] || 0) + 1;
    memoryStorage.save("emotionCount", emotionCount);
  }
  let enhancedResponse = "";
  if (detectedEmotion === "positive") enhancedResponse = "기분이 좋으시다니 저도 기뻐요!";
  else if (detectedEmotion === "negative") enhancedResponse = "마음이 힘드시다니 안타깝네요. 제가 위로해드릴게요.";
  else if (detectedEmotion === "surprise") enhancedResponse = "정말 놀라운 일이네요!";
  if (detectedEmotion === "negative" && emotionCount["negative"] >= 3) {
    enhancedResponse += " 여러 번 우울한 감정을 느끼셨네요. 혹시 도움이 필요하시면 전문가와 상담해보시는 건 어떨까요?";
  }
  if (lowerInput.includes("뭐해") || lowerInput.includes("무엇을")) enhancedResponse = "저는 여기서 당신과 대화 중이에요!";
  return enhancedResponse || null;
}

const intents = {
  addEvent: ["일정", "추가", "예약", "회의"],
  getWeather: ["날씨", "어때"],
  getTime: ["시간", "몇 시"]
};
function detectIntent(input) {
  const lowerInput = input.toLowerCase();
  for (let intent in intents) {
    if (intents[intent].some(keyword => lowerInput.includes(keyword))) return intent;
  }
  return null;
}

function isNewsQuery(input) {
  const newsKeywords = ["뉴스", "속보", "보도", "언론", "이슈", "사건", "정치", "사회", "경제"];
  return newsKeywords.some(keyword => input.includes(keyword));
}

async function pipelineNewsSearch(userInput) {
  let query = userInput;
  if (isNewsQuery(userInput)) query += " site:news.google.com OR site:n.news.naver.com";
  const results = await getGoogleSearchResults(query);
  const summary = results.split(", ").slice(0, 5).join("\n- ");
  showSpeechBubbleInChunks("뉴스 요약:\n- " + summary);
}

/***** 음성 출력 *****/
function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.volume = 1;
  utterance.rate = 1.5;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

/***** 캘린더 관련 함수 *****/
function deleteCalendarEvent(day) {
  const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${day}`);
  if (eventDiv) {
    eventDiv.textContent = "";
    let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
    delete calendarData[`${currentYear}-${currentMonth+1}-${day}`];
    localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
    return `${currentYear}-${currentMonth+1}-${day} 일정이 삭제되었습니다.`;
  } else {
    return "해당 날짜에 일정이 없습니다.";
  }
}

function getCalendarEvents(dateStr = null) {
  const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
  if (!Object.keys(calendarData).length) return "저장된 일정이 없습니다. 먼저 날짜 셀을 클릭하여 일정을 입력해주세요.";
  if (dateStr) {
    return calendarData[dateStr] ? `${dateStr}의 일정: ${calendarData[dateStr]}` : `${dateStr}에는 일정이 없습니다.`;
  } else {
    const currentMonthStr = `${currentYear}-${currentMonth+1}`;
    let events = [];
    for (let key in calendarData) {
      if (key.startsWith(currentMonthStr)) events.push(`${key}: ${calendarData[key]}`);
    }
    return events.length ? `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}` : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
  }
}

/***** 날씨 및 지도 *****/
function updateMap() {
  const englishCity = regionMap[currentCity] || "Seoul";
  document.getElementById("map-iframe").src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
}

async function getWeather() {
  if (!weatherKey) return { message: "날씨 API 키가 설정되지 않았습니다." };
  try {
    const englishCity = regionMap[currentCity] || "Seoul";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(englishCity)}&appid=${weatherKey}&units=metric&lang=kr`;
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

function updateWeatherEffects() {
  if (!currentWeather) return;
  // 날씨 효과 로직 (원본에 정의된 Three.js 객체가 없으므로 주석 처리)
  // if (currentWeather.includes("비") || currentWeather.includes("소나기")) { rainGroup.visible = true; cloudRainGroup.visible = true; } else { rainGroup.visible = false; cloudRainGroup.visible = false; }
  // if (currentWeather.includes("구름") || currentWeather.includes("흐림")) { houseCloudGroup.visible = true; } else { houseCloudGroup.visible = false; }
}

async function updateWeatherAndEffects(sendMessage = true) {
  const weatherData = await getWeather();
  if (sendMessage) showSpeechBubbleInChunks(weatherData.message);
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
    const transcript = event.results[0][0].transcript.trim();
    if (confirm(`"${transcript}" 맞나요?`)) {
      document.getElementById("chat-input").value = transcript;
      sendChat();
    }
  };
  recognition.onerror = function(event) {
    console.error("음성 인식 오류:", event.error);
  };
}

/***** 대화 맥락 유지 *****/
function updateContext(intent) {
  lastTopic = intent;
  memoryStorage.save("lastTopic", lastTopic);
}

/***** 구글 검색 API *****/
async function getGoogleSearchResults(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) return "구글 API 키 또는 검색 엔진 ID가 설정되지 않았습니다.";
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("구글 검색 API 호출 실패");
    const data = await res.json();
    return data.items && data.items.length > 0 ? data.items.map(item => item.title).join(", ") : "검색 결과가 없습니다.";
  } catch (error) {
    console.error(error);
    return "검색 결과를 가져오는데 실패했습니다.";
  }
}

/***** 채팅 처리 *****/
async function sendChat() {
  const inputEl = document.getElementById("chat-input");
  const input = inputEl.value.trim();
  if (!input) return;
  let response = "";
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("일정 알려") || lowerInput.includes("일정 뭐") || lowerInput.includes("일정 보여")) {
    const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
    response = dateMatch ? getCalendarEvents(dateMatch[0]) : getCalendarEvents();
  } else if (lowerInput.startsWith("구글 ")) {
    const query = input.replace("구글 ", "").trim();
    response = query ? await getGoogleSearchResults(query) : "검색어를 입력해주세요. 예: 구글 날씨";
  } else if (isNewsQuery(input)) {
    await pipelineNewsSearch(input);
    inputEl.value = "";
    return;
  } else {
    for (let site in SITE_LINKS) {
      if (lowerInput.includes(site)) {
        response = `${site} 사이트로 이동합니다! 잠시만 기다려 주세요.`;
        showSpeechBubbleInChunks(response);
        setTimeout(() => { window.location.href = SITE_LINKS[site]; }, 2000);
        inputEl.value = "";
        return;
      }
    }

    const nlpResponse = processNLP(input);
    if (nlpResponse) response = nlpResponse;

    const intent = detectIntent(input);
    if (intent === "addEvent") {
      const eventMatch = input.match(/(오늘|내일|\d{4}-\d{1,2}-\d{1,2})\s*(\d{1,2})시/);
      if (eventMatch) {
        let date = eventMatch[1] === "오늘" ? new Date() : eventMatch[1] === "내일" ? new Date(Date.now() + 86400000) : new Date(eventMatch[1]);
        date.setHours(parseInt(eventMatch[2]));
        const eventText = input.replace(eventMatch[0], "").trim();
        const dateKey = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
        let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
        calendarData[dateKey] = eventText;
        localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
        renderCalendar(currentYear, currentMonth);
        response = `${dateKey}에 "${eventText}" 일정이 추가되었습니다.`;
        updateContext("addEvent");
      }
    } else if (intent === "getWeather") {
      const weatherData = await getWeather();
      response = weatherData.message;
      updateContext("weather");
    } else if (intent === "getTime") {
      const now = new Date();
      response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
      updateContext("time");
    }

    if (!response && lastTopic === "weather" && lowerInput.includes("내일")) {
      response = "내일 날씨는 비가 올 예정입니다.";
    }

    if (!response) {
      if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if (newCity && regionList.includes(newCity)) {
          currentCity = newCity;
          document.getElementById("region-select").value = newCity;
          response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
          updateMap();
          await updateWeatherAndEffects();
        } else {
          response = "죄송해요, 그 지역은 지원하지 않아요. 드롭다운 메뉴에서 선택해주세요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        document.getElementById("region-select").value = input;
        response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
        updateMap();
        await updateWeatherAndEffects();
      } else if (KEYWORDS.delete.some(keyword => lowerInput.includes(keyword))) {
        const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
        response = dayStr ? deleteCalendarEvent(parseInt(dayStr)) : "삭제할 날짜를 입력하지 않으셨습니다.";
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
          "그렇군요. 당신의 의견을 듣고 있으니 저도 많이 배워요.",
          "그렇게 느끼실 수 있겠네요. 함께 이야기 나눠봐요!"
        ];
        response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
      }
    }
  }

  memoryStorage.save('lastInput', input);
  memoryStorage.save('lastResponse', response);
  updateConversationHistory(input, response);
  learnFromInteractions();
  showSpeechBubbleInChunks(response);
  inputEl.value = "";
}

/***** 말풍선 출력 *****/
function showSpeechBubbleInChunks(text, chunkSize = 15, delay = 1500) {
  const bubble = document.getElementById("speech-bubble");
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize));
  let index = 0;
  function showNextChunk() {
    if (index < chunks.length) {
      bubble.textContent = chunks[index];
      bubble.style.display = "block";
      speakText(chunks[index]);
      index++;
      setTimeout(showNextChunk, delay);
    } else {
      setTimeout(() => { bubble.style.display = "none"; }, 3000);
    }
  }
  showNextChunk();
}

/***** DevTools 감지 및 API 키 삭제 *****/
function isDevToolsOpen() {
  if (/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) return false;
  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;
  return widthThreshold || heightThreshold;
}

setInterval(() => {
  if (isDevToolsOpen()) {
    GOOGLE_API_KEY = "";
    GOOGLE_CSE_ID = "";
    weatherKey = "";
    console.log("개발자 도구가 열려 있어 API 키가 삭제되었습니다.");
  }
}, 1000);

/***** 이벤트 리스너 *****/
window.addEventListener("DOMContentLoaded", function() {
  const chatInput = document.getElementById("chat-input");
  chatInput.setAttribute("list", "chat-keywords");
  const autoCompleteList = document.createElement("datalist");
  autoCompleteList.id = "chat-keywords";
  const allKeywords = Object.values(KEYWORDS).flat().concat(Object.keys(SITE_LINKS));
  allKeywords.forEach(kw => {
    const option = document.createElement("option");
    option.value = kw;
    autoCompleteList.appendChild(option);
  });
  document.body.appendChild(autoCompleteList);
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
});

window.addEventListener("resize", function() {
  // Three.js 관련 코드가 없으므로 주석 처리
  // camera.aspect = window.innerWidth / window.innerHeight;
  // camera.updateProjectionMatrix();
  // renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("load", async () => {
  initCalendar();
  updateMap();
  await updateWeatherAndEffects();
});

/***** 캘린더 렌더링 *****/
let currentYear, currentMonth;
function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  populateYearSelect();
  renderCalendar(currentYear, currentMonth);
  document.getElementById("prev-month").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar(currentYear, currentMonth);
  });
  document.getElementById("next-month").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar(currentYear, currentMonth);
  });
  document.getElementById("year-select").addEventListener("change", (e) => {
    currentYear = parseInt(e.target.value);
    renderCalendar(currentYear, currentMonth);
  });
}

function renderCalendar(year, month) {
  console.log(`${year}년 ${month + 1}월 캘린더 렌더링`);
}

function populateYearSelect() {
  const yearSelect = document.getElementById("year-select");
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    if (i === currentYear) option.selected = true;
    yearSelect.appendChild(option);
  }
}
