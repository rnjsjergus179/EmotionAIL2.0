import { processText, fetchAndUpdateKeywords, getEmbedding, getWeather, getNaverSearchResults, getYouTubeSearchResults } from './api.js';
import { softmaxIntentClassifier, updateGRUState, updateIntentWeights } from './ai/ml.js';
import { memoryStorage, updateConversationHistory } from './memory.js';
import { showSpeechBubbleInChunks, deleteCalendarEvent, getCalendarEvents, updateMap, initCalendar } from './ui.js';
import { scene, camera, renderer, characterGroup, characterStreetlight, characterLight, stars, fireflies, sun, moon, head, rainGroup, cloudRainGroup, houseCloudGroup, lightningLight, updateWeatherEffects, updateLightning, updateHouseClouds, updateBubblePosition, animate } from './threeSetup.js';

// 사이트 링크 설정
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

// 키워드 설정
let KEYWORDS = {
  greetings: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네"],
  sleep: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
  weather: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
  calendar: ["일정 알려줘"],
  time: ["시간 알려줘"],
  delete: ["하루일정 삭제", "하루일과 삭제해줘", "하루일과", "하루일저", "하루 일관"]
};

// 의도별 학습 가중치 행렬 초기화
let intentWeightMatrix = {};
Object.keys(KEYWORDS).forEach(intent => {
  intentWeightMatrix[intent] = Array(300).fill(0.01);
});

// GRU 상태 초기화
let gruHiddenState = Array(300).fill(0);

// 대화 이력 임베딩
let historyEmbeddings = [];

// 학습률
let adaptiveLearningRate = 0.01;

// Knowledge Graph 설정
const knowledgeGraph = {
  "넷플릭스": ["드라마", "영화"],
  "유튜브": ["영상", "비디오"],
  "날씨": ["weather"],
  "일정": ["calendar"]
};

// 뉴스 쿼리 확인 함수
function isNewsQuery(input) {
  const newsKeywords = ["뉴스", "속보", "보도", "언론", "이슈", "사건", "정치", "사회", "경제"];
  return newsKeywords.some(keyword => input.includes(keyword));
}

// 뉴스 검색 파이프라인
async function pipelineNewsSearch(userInput) {
  const query = userInput + " news";
  const results = await getNaverSearchResults(query);
  return `뉴스 요약:\n- ${results}`;
}

// 채팅 전송 함수
async function sendChat() {
  const inputEl = document.getElementById("chat-input");
  if (!inputEl) return;
  const input = inputEl.value.trim();
  if (!input) return;

  let response = "";
  let isHTML = false;
  let shouldNavigate = false;
  let navigateUrl = "";
  const processedInput = await processText(input);
  const lowerInput = processedInput.toLowerCase();
  let currentCity = "서울"; // 기본 도시 설정
  let lastTopic = memoryStorage.load("lastTopic") || "";
  
  // 지역 목록
  const regionMap = {
    "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
    "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
    "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
    "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
    "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
  };
  const regionList = Object.keys(regionMap);

  // 키워드 및 가중치 업데이트
  await fetchAndUpdateKeywords(KEYWORDS, intentWeightMatrix);

  // 사용자 입력에 따른 응답 처리
  if (lowerInput.includes("일정 알려") || lowerInput.includes("일정 뭐") || lowerInput.includes("일정 보여")) {
    const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
    response = dateMatch ? getCalendarEvents(dateMatch[0]) : getCalendarEvents();
  } else if (isNewsQuery(input)) {
    response = await pipelineNewsSearch(input);
  } else {
    for (let site in SITE_LINKS) {
      if (lowerInput.includes(site)) {
        if (site === "유튜브" || site === "youtube") {
          const query = lowerInput.replace(/유튜브|youtube|동영상|비디오|영상/gi, "").trim();
          if (query) {
            response = await getYouTubeSearchResults(query);
            isHTML = true;
          } else {
            response = "유튜브 검색어를 입력해주세요. 예: 고양이 비디오";
          }
          lastTopic = memoryStorage.save("lastTopic", "youtubeSearch");
        } else if (site === "네이버" || site === "naver") {
          const query = lowerInput.replace(/네이버|naver|검색|찾기/gi, "").trim();
          if (query) {
            const naverResults = await getNaverSearchResults(query);
            response = naverResults ? `검색 결과:\n- ${naverResults}` : "검색 결과를 가져오는데 실패했습니다.";
          } else {
            response = "검색어를 입력해주세요. 예: 네이버 날씨";
          }
          lastTopic = memoryStorage.save("lastTopic", "naverSearch");
        } else {
          response = `${site} 사이트로 이동합니다! 잠시만 기다려 주세요.`;
          shouldNavigate = true;
          navigateUrl = SITE_LINKS[site];
        }
        break;
      }
    }

    // 사이트 이동이 아닌 경우 의도 분류
    if (!response) {
      const { intent, probabilities, embedding } = await softmaxIntentClassifier(input, historyEmbeddings, intentWeightMatrix, getEmbedding);
      if (intent && probabilities[intent] > 0.5) {
        if (intent === "greetings") {
          response = "안녕하세요! 만나서 반갑습니다. 오늘 하루 어떠셨나요?";
        } else if (intent === "sleep") {
          response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
        } else if (intent === "weather") {
          const weatherData = await getWeather(currentCity);
          response = weatherData.message;
          updateWeatherEffects(weatherData.currentWeather); // threeSetup.js와 연결
        } else if (intent === "calendar") {
          response = getCalendarEvents();
        } else if (intent === "time") {
          const now = new Date();
          response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
        } else if (intent === "delete") {
          const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
          if (dayStr) {
            const dayNum = parseInt(dayStr);
            response = deleteCalendarEvent(dayNum);
          } else {
            response = "삭제할 날짜를 입력하지 않으셨습니다.";
          }
        }
        lastTopic = memoryStorage.save("lastTopic", intent);

        // 사용자 피드백 반영
        setTimeout(() => {
          const feedback = prompt("응답이 마음에 드시면 '좋아요', 아니라면 '싫어요'를 입력해주세요:");
          if (feedback && feedback.includes("좋아요")) {
            adaptiveLearningRate *= 1.05;
            updateIntentWeights(embedding, intent, "positive", intentWeightMatrix, adaptiveLearningRate);
          } else if (feedback && feedback.includes("싫어요")) {
            adaptiveLearningRate *= 0.95;
            updateIntentWeights(embedding, intent, "negative", intentWeightMatrix, adaptiveLearningRate);
          }
        }, 3000);
      } else if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if (newCity && regionList.includes(newCity)) {
          currentCity = newCity;
          const regionSelect = document.getElementById("region-select");
          if (regionSelect) regionSelect.value = newCity;
          response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
          updateMap(currentCity);
          const weatherData = await getWeather(currentCity);
          showSpeechBubbleInChunks(weatherData.message);
          updateWeatherEffects(weatherData.currentWeather); // threeSetup.js와 연결
        } else {
          response = "죄송해요, 그 지역은 지원하지 않아요. 드롭다운 메뉴에서 선택해주세요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        const regionSelect = document.getElementById("region-select");
        if (regionSelect) regionSelect.value = input;
        response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
        updateMap(currentCity);
        const weatherData = await getWeather(currentCity);
        showSpeechBubbleInChunks(weatherData.message);
        updateWeatherEffects(weatherData.currentWeather); // threeSetup.js와 연결
      } else {
        response = `잘 이해하지 못했어요. 의도 확률: ${JSON.stringify(probabilities)}`;
      }
    }
  }

  // 응답 출력 및 대화 이력 업데이트
  showSpeechBubbleInChunks(response, isHTML);
  const embedding = await getEmbedding(input);
  updateConversationHistory(input, response, embedding, historyEmbeddings);
  gruHiddenState = updateGRUState(embedding, gruHiddenState);

  // 사이트로 이동
  if (shouldNavigate) {
    setTimeout(() => { window.location.href = navigateUrl; }, 2000);
  }

  inputEl.value = "";
  memoryStorage.save('lastInput', input);
  memoryStorage.save('lastResponse', response);
}

// 이벤트 리스너 설정
document.addEventListener("contextmenu", event => event.preventDefault());

// 페이지 로드 시 초기화
window.addEventListener("DOMContentLoaded", async function() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.setAttribute("list", "Charge");
    chatInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendChat();
    });
  }

  // 자동완성 데이터리스트 생성
  const autoCompleteList = document.createElement("datalist");
  autoCompleteList.id = "Charge";
  const allKeywords = Object.values(KEYWORDS).flat().concat(Object.keys(SITE_LINKS));
  allKeywords.forEach(kw => {
    const option = document.createElement("option");
    option.value = kw;
    autoCompleteList.appendChild(option);
  });
  document.body.appendChild(autoCompleteList);

  // 지역 선택 드롭다운 설정
  const regionSelect = document.getElementById("region-select");
  if (regionSelect) {
    const regionMap = {
      "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
      "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
      "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
      "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
      "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
    };
    const regionList = Object.keys(regionMap);
    regionList.forEach(region => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = `${region} (${regionMap[region]})`;
      if (region === "서울") option.selected = true;
      regionSelect.appendChild(option);
    });
  }

  await fetchAndUpdateKeywords(KEYWORDS, intentWeightMatrix);
});

// 윈도우 크기 조정 시 카메라 및 렌더러 업데이트
window.addEventListener("resize", function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 페이지 로드 완료 시 초기화 및 애니메이션 시작
window.addEventListener("load", async () => {
  try {
    initCalendar();
    updateMap("서울");
    const weatherData = await getWeather("서울");
    showSpeechBubbleInChunks(weatherData.message);
    updateWeatherEffects(weatherData.currentWeather); // threeSetup.js와 연결
    animate(characterGroup, characterStreetlight, characterLight, stars, fireflies, sun, moon, head, camera); // threeSetup.js와 연결
  } catch (err) {
    console.error("로드 이벤트 에러:", err);
  }
});
