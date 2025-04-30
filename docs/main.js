import { SITE_LINKS, KEYWORDS, regionMap, regionList } from './config.js';
import { logToServer, fetchAndUpdateKeywords, processText, getEmbedding } from './api.js';
import { initializeIntentWeightMatrix, historyEmbeddings, gruHiddenState, adaptiveLearningRate, adjustLearningRate, currentWeather } from './memory.js';
import { softmaxIntentClassifier, updateIntentWeights, detectIntent } from './ai/intent.js';
import { getWeather } from './weather.js';
import { deleteCalendarEvent, getCalendarEvents, initCalendar, currentYear, currentMonth } from './calendar.js';
import { speakText, startSpeechRecognition } from './speech.js';
import { getNaverSearchResults, getYouTubeSearchResults, pipelineNewsSearch, isNewsQuery } from './search.js';
import { camera, renderer, animate, updateBubblePosition } from './threeD.js';
import { vectorAdd, vectorMultiply } from '/ai/utils.js';

initializeIntentWeightMatrix(Object.keys(KEYWORDS));

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

function updateConversationHistory(input, response, embedding) {
  try {
    let history = memoryStorage.load("conversationHistory") || [];
    history.push({ timestamp: Date.now(), input, response });
    historyEmbeddings.push(embedding);
    memoryStorage.save("conversationHistory", history.slice(-50));
    historyEmbeddings = historyEmbeddings.slice(-3);
  } catch(e) {
    console.error("대화 이력 저장 오류:", e);
  }
}

async function updateEmbeddingsAndIntents() {
  const processedData = await fetchAndUpdateKeywords();
  for (let intent in KEYWORDS) {
    const keywordsText = KEYWORDS[intent].join(" ");
    const newEmbedding = await getEmbedding(keywordsText);
    intentWeightMatrix[intent] = vectorAdd(
      intentWeightMatrix[intent],
      vectorMultiply(newEmbedding, 0.1)
    );
  }
}

function updateMap(currentCity) {
  const englishCity = regionMap[currentCity] || "Seoul";
  const mapIframe = document.getElementById("map-iframe");
  if (mapIframe) {
    mapIframe.src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
  }
}

async function updateWeatherAndEffects(currentCity, sendMessage = true) {
  const weatherData = await getWeather(currentCity);
  if (sendMessage) {
    showSpeechBubbleInChunks(weatherData.message);
  }
  currentWeather = weatherData.currentWeather;
  return weatherData.currentWeather;
}

function changeRegion(value) {
  const currentCity = value;
  updateMap(currentCity);
  updateWeatherAndEffects(currentCity);
  const englishCity = regionMap[currentCity] || "Seoul";
  const message = `지역이 ${currentCity} (${englishCity})로 변경되었습니다.`;
  showSpeechBubbleInChunks(message);
  return currentCity;
}

function updateContext(intent) {
  const lastTopic = intent;
  memoryStorage.save("lastTopic", lastTopic);
  return lastTopic;
}

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
  let currentCity = "서울";
  let lastTopic = memoryStorage.load("lastTopic") || "";
  const processedData = await fetchAndUpdateKeywords();

  if (lowerInput.includes("일정 알려") || lowerInput.includes("일정 뭐") || lowerInput.includes("일정 보여")) {
    const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
    response = dateMatch ? getCalendarEvents(dateMatch[0], currentYear, currentMonth) : getCalendarEvents(null, currentYear, currentMonth);
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
          lastTopic = updateContext("youtubeSearch");
        } else if (site === "네이버" || site === "naver") {
          const query = lowerInput.replace(/네이버|naver|검색|찾기/gi, "").trim();
          if (query) {
            const naverResults = await getNaverSearchResults(query);
            response = naverResults ? `검색 결과:\n- ${naverResults}` : "검색 결과를 가져오는데 실패했습니다.";
          } else {
            response = "검색어를 입력해주세요. 예: 네이버 날씨";
          }
          lastTopic = updateContext("naverSearch");
        } else {
          response = `${site} 사이트로 이동합니다! 잠시만 기다려 주세요.`;
          shouldNavigate = true;
          navigateUrl = SITE_LINKS[site];
        }
        break;
      }
    }

    if (!response) {
      const { intent, probabilities, embedding } = await softmaxIntentClassifier(input, historyEmbeddings);
      if (intent && probabilities[intent] > 0.5) {
        if (intent === "greetings") {
          response = "안녕하세요! 만나서 반갑습니다. 오늘 하루 어떠셨나요?";
        } else if (intent === "sleep") {
          response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
        } else if (intent === "weather") {
          const weatherData = await getWeather(currentCity);
          response = weatherData.message;
          currentWeather = weatherData.currentWeather;
        } else if (intent === "calendar") {
          response = getCalendarEvents(null, currentYear, currentMonth);
        } else if (intent === "time") {
          const now = new Date();
          response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
        } else if (intent === "delete") {
          const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
          if (dayStr) {
            const dayNum = parseInt(dayStr);
            response = deleteCalendarEvent(dayNum, currentYear, currentMonth);
          } else {
            response = "삭제할 날짜를 입력하지 않으셨습니다.";
          }
        }
        lastTopic = updateContext(intent);

        setTimeout(() => {
          const feedback = prompt("응답이 마음에 드시면 '좋아요', 아니라면 '싫어요'를 입력해주세요:");
          if (feedback && feedback.includes("좋아요")) {
            adjustLearningRate("good");
            updateIntentWeights(embedding, intent, "positive");
          } else if (feedback && feedback.includes("싫어요")) {
            adjustLearningRate("bad");
            updateIntentWeights(embedding, intent, "negative");
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
          await updateWeatherAndEffects(currentCity);
        } else {
          response = "죄송해요, 그 지역은 지원하지 않아요. 드롭다운 메뉴에서 선택해주세요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        const regionSelect = document.getElementById("region-select");
        if (regionSelect) regionSelect.value = input;
        response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
        updateMap(currentCity);
        await updateWeatherAndEffects(currentCity);
      } else {
        response = `잘 이해하지 못했어요. 의도 확률: ${JSON.stringify(probabilities)}`;
      }
    }
  }

  showSpeechBubbleInChunks(response, isHTML);
  const embedding = await getEmbedding(input);
  updateConversationHistory(input, response, embedding);

  if (shouldNavigate) {
    setTimeout(() => { window.location.href = navigateUrl; }, 2000);
  }

  inputEl.value = "";
  memoryStorage.save('lastInput', input);
  memoryStorage.save('lastResponse', response);
}

function showSpeechBubbleInChunks(text, isHTML = false, chunkSize = 15, delay = 500) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) return;
  bubble.style.opacity = 0;
  bubble.style.display = "block";
  let parts = isHTML ? text.split("<br>") : [];
  if (!isHTML) {
    for (let i = 0; i < text.length; i += chunkSize) parts.push(text.slice(i, i + chunkSize));
  }
  let index = 0;
  bubble.innerHTML = "";

  function showNextPart() {
    if (index === 0) bubble.style.opacity = 1;
    if (index < parts.length) {
      if (isHTML) {
        bubble.innerHTML += parts[index] + "<br>";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = parts[index];
        speakText(tempDiv.textContent);
      } else {
        bubble.textContent += parts[index];
        speakText(parts[index]);
      }
      index++;
      requestAnimationFrame(showNextPart);
    } else {
      setTimeout(() => { bubble.style.opacity = 0; setTimeout(() => bubble.style.display = "none", 500); }, 2000);
    }
  }
  requestAnimationFrame(showNextPart);
}

document.addEventListener("contextmenu", event => event.preventDefault());

window.addEventListener("DOMContentLoaded", async function() {
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
      if (region === "서울") option.selected = true;
      regionSelect.appendChild(option);
    });
  }

  await fetchAndUpdateKeywords();
  await updateEmbeddingsAndIntents();
});

window.addEventListener("resize", function() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

window.addEventListener("load", async () => {
  try {
    initCalendar(showSpeechBubbleInChunks);
    updateMap("서울");
    await updateWeatherAndEffects("서울");
    animate(updateBubblePosition);
  } catch (err) {
    console.error("로드 이벤트 에러:", err);
  }
});
