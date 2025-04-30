// main.js

// TensorFlow.js가 HTML에 포함되어 있는지 확인하세요.
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>

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

let KEYWORDS = {
  greetings: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네"],
  sleep: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
  weather: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
  calendar: ["일정 알려줘", "일정 뭐야", "일정 보여줘"],
  time: ["시간 알려줘"],
  delete: ["하루일정 삭제", "하루일과 삭제해줘", "일정 삭제"]
};

let intentWeightMatrix = {};
Object.keys(KEYWORDS).forEach(intent => {
  intentWeightMatrix[intent] = Array(300).fill(0.01); // 임베딩 차원 300
});

const API_BASE_URL = 'https://emotionail2-0.onrender.com';
let gruHiddenState = Array(300).fill(0);
let historyEmbeddings = [];
let adaptiveLearningRate = 0.01;

const knowledgeGraph = {
  "넷플릭스": ["드라마", "영화"],
  "유튜브": ["영상", "비디오"],
  "날씨": ["weather"],
  "일정": ["calendar"]
};

const apiCache = {};

/***** 유틸리티 함수 *****/
function fullyConnected(input, weights) {
  return weights.map(row => dotProduct(input, row));
}

function relu(vector) {
  return vector.map(val => Math.max(0, val));
}

function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function weightedSum(values, weights) {
  return values.map((val, i) => val * weights[i]).reduce((a, b) => a + b, 0);
}

function averageVectors(vectors) {
  if (vectors.length === 0) return Array(300).fill(0);
  const sum = vectors.reduce((acc, vec) => acc.map((val, i) => val + vec[i]), Array(vectors[0].length).fill(0));
  return sum.map(val => val / vectors.length);
}

function softmaxArray(arr) {
  const maxVal = Math.max(...arr);
  const exps = arr.map(val => Math.exp(val - maxVal));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

/***** Jaccard Similarity 함수 *****/
function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1);
  const set2 = new Set(str2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/***** 다층 신경망 (MLP) 구현 *****/
function buildMLP(inputVector, layers = [128, 64, 32, Object.keys(intentWeightMatrix).length]) {
  let x = inputVector;
  for (let i = 0; i < layers.length - 1; i++) {
    const weights = Array(layers[i]).fill().map(() => Array(x.length).fill(0.01));
    x = fullyConnected(x, weights);
    x = relu(x);
  }
  const outputWeights = Array(layers[layers.length - 1]).fill().map(() => Array(x.length).fill(0.01));
  x = fullyConnected(x, outputWeights);
  return softmax(x);
}

/***** Self-Attention 구현 *****/
function selfAttention(embeddings) {
  const query = embeddings;
  const key = embeddings;
  const value = embeddings;
  const scores = dotProduct(query, key) / Math.sqrt(embeddings.length);
  const attentionWeights = softmaxArray([scores]);
  return weightedSum(value, attentionWeights);
}

/***** Sequence Memory 구현 *****/
function getSequenceEmbedding(historyEmbeddings, currentEmbedding) {
  const all = historyEmbeddings.concat([currentEmbedding]);
  return averageVectors(all);
}

/***** 다중 모달 입력 - 위치 정보 감지 *****/
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords),
        error => reject(error)
      );
    } else {
      reject(new Error("이 브라우저는 지리적 위치를 지원하지 않습니다."));
    }
  });
}

/***** 자가 강화 학습 - 학습률 조정 *****/
function adjustLearningRate(feedbackQuality) {
  if (feedbackQuality === "good") {
    adaptiveLearningRate *= 1.05;
  } else if (feedbackQuality === "bad") {
    adaptiveLearningRate *= 0.95;
  }
}

/***** 전역 변수 및 초기 설정 *****/
document.addEventListener("contextmenu", event => event.preventDefault());

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

async function fetchAndUpdateKeywords() {
  try {
    await logToServer("MongoDB 데이터 가져오기 시작");
    const response = await fetch(`${API_BASE_URL}/api/processed-data?limit=1000`);
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

async function processText(text) {
  if (!text || typeof text !== 'string') return "";
  try {
    const response = await fetch(`${API_BASE_URL}/api/morph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const { analyzed } = await response.json();
    return analyzed ? analyzed.join(' ') : text;
  } catch (error) {
    console.error("형태소 분석 실패:", error);
    return text;
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

function vectorAdd(a, b) {
  return a.map((val, i) => val + b[i]);
}

function vectorSubtract(a, b) {
  return a.map((val, i) => val - b[i]);
}

function vectorMultiply(a, scalar) {
  return a.map(val => val * scalar);
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/***** 미니 GRU 기억 구조 *****/
function updateGRUState(inputEmbedding, prevHidden) {
  const Wz = Array(300).fill(0.01);
  const Wr = Array(300).fill(0.01);
  const Wh = Array(300).fill(0.01);

  const z = sigmoid(dotProduct(Wz, inputEmbedding) + dotProduct(Wz, prevHidden));
  const r = sigmoid(dotProduct(Wr, inputEmbedding) + dotProduct(Wr, prevHidden));
  const hTilde = vectorMultiply(prevHidden, r);
  const newHidden = vectorAdd(vectorMultiply(prevHidden, 1 - z), vectorMultiply(hTilde, z));
  
  return newHidden;
}

/***** Softmax 의도 분류기 (Jaccard + TensorFlow.js) *****/
let intentModel;

async function loadIntentModel() {
  try {
    // 실제 모델 URL로 교체 필요
    intentModel = await tf.loadLayersModel('https://your-model-url.com/model.json');
    console.log("Pre-trained intent model loaded successfully");
  } catch (error) {
    console.error("Failed to load intent model:", error);
  }
}

async function softmaxIntentClassifier(inputText, historyEmbeddings) {
  // Step 1: Jaccard Similarity 기반 키워드 매칭
  let maxJaccard = 0;
  let bestIntent = null;

  for (const intent in KEYWORDS) {
    const keywords = KEYWORDS[intent];
    let intentMaxJaccard = 0;
    for (const keyword of keywords) {
      const sim = jaccardSimilarity(inputText, keyword);
      if (sim > intentMaxJaccard) {
        intentMaxJaccard = sim;
      }
    }
    if (intentMaxJaccard > maxJaccard) {
      maxJaccard = intentMaxJaccard;
      bestIntent = intent;
    }
  }

  if (maxJaccard >= 0.3) {
    const probabilities = {};
    for (const intent in KEYWORDS) {
      probabilities[intent] = intent === bestIntent ? 1 : 0;
    }
    const embedding = await getEmbedding(inputText);
    return { intent: bestIntent, probabilities, embedding };
  } else {
    // Step 2: Jaccard 실패 시 TensorFlow.js 모델 사용
    const inputEmbedding = await getEmbedding(inputText);
    if (intentModel) {
      const inputTensor = tf.tensor([inputEmbedding]);
      const prediction = intentModel.predict(inputTensor);
      const probabilitiesArray = prediction.dataSync();
      const intents = Object.keys(KEYWORDS);
      const probabilities = {};
      let maxProb = 0;
      let detectedIntent = null;

      probabilitiesArray.forEach((prob, index) => {
        probabilities[intents[index]] = prob;
        if (prob > maxProb) {
          maxProb = prob;
          detectedIntent = intents[index];
        }
      });

      if (maxProb >= 0.5) {
        return { intent: detectedIntent, probabilities, embedding: inputEmbedding };
      } else {
        return { intent: 'unknown', probabilities, embedding: inputEmbedding };
      }
    } else {
      console.warn("Intent model not loaded, using fallback logic");
      const sequenceEmbedding = getSequenceEmbedding(historyEmbeddings, inputEmbedding);
      const attendedEmbedding = selfAttention(sequenceEmbedding);
      
      let logits = {};
      let expSum = 0;

      for (let intent in intentWeightMatrix) {
        logits[intent] = dotProduct(attendedEmbedding, intentWeightMatrix[intent]);
        expSum += Math.exp(logits[intent]);
      }

      let probabilities = {};
      for (let intent in logits) {
        probabilities[intent] = Math.exp(logits[intent]) / expSum;
      }

      let maxProb = 0;
      let detectedIntent = null;
      for (let intent in probabilities) {
        if (probabilities[intent] > maxProb) {
          maxProb = probabilities[intent];
          detectedIntent = intent;
        }
      }

      if (maxProb >= 0.5) {
        return { intent: detectedIntent, probabilities, embedding: attendedEmbedding };
      } else {
        return { intent: 'unknown', probabilities, embedding: attendedEmbedding };
      }
    }
  }
}

/***** Self-Training 강화학습 *****/
function updateIntentWeights(inputEmbedding, predictedIntent, userFeedback) {
  const reward = userFeedback === "positive" ? 1 : userFeedback === "negative" ? -1 : 0;

  for (let intent in intentWeightMatrix) {
    const grad = intent === predictedIntent ? reward : -reward / (Object.keys(intentWeightMatrix).length - 1);
    intentWeightMatrix[intent] = vectorAdd(
      intentWeightMatrix[intent],
      vectorMultiply(inputEmbedding, adaptiveLearningRate * grad)
    );
  }
}

/***** Embedding + Intent Vector 업데이트 *****/
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

/***** 메모리 저장 및 로드 *****/
const memoryStorage = {
  save: function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  load: function(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error loading key:", key, e);
      return null;
    }
  }
};

function updateConversationHistory(input, response, embedding) {
  try {
    let history = memoryStorage.load("conversationHistory") || [];
    history.push({ timestamp: Date.now(), input, response, embedding });
    historyEmbeddings = [embedding];
    memoryStorage.save("conversationHistory", history.slice(-50));
  } catch (e) {
    console.error("대화 이력 저장 오류:", e);
  }
}

/***** 의도 인식 및 처리 *****/
async function detectIntent(input, processedData) {
  const { intent, probabilities, embedding } = await softmaxIntentClassifier(input, historyEmbeddings);
  gruHiddenState = updateGRUState(embedding, gruHiddenState);

  for (let concept in knowledgeGraph) {
    if (input.includes(concept)) {
      const relatedIntents = knowledgeGraph[concept];
      relatedIntents.forEach(relatedIntent => {
        if (probabilities[relatedIntent]) {
          probabilities[relatedIntent] *= 1.2;
        }
      });
    }
  }

  let maxProb = 0;
  let detectedIntent = null;
  for (let intent in probabilities) {
    if (probabilities[intent] > maxProb) {
      maxProb = probabilities[intent];
      detectedIntent = intent;
    }
  }

  if (probabilities[detectedIntent] > 0.5 || detectedIntent !== 'unknown') {
    return detectedIntent;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, processedData })
    });
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    await logToServer("의도 인식 API 호출 성공");
    return data.intent || null;
  } catch (error) {
    await logToServer(`의도 인식 API 호출 실패: ${error.message}`);
    return null;
  }
}

function isNewsQuery(input) {
  const newsKeywords = ["뉴스", "속보", "보도", "언론", "이슈", "사건", "정치", "사회", "경제"];
  return newsKeywords.some(keyword => input.includes(keyword));
}

async function pipelineNewsSearch(userInput) {
  const query = userInput + " news";
  const results = await getNaverSearchResults(query);
  const summary = "뉴스 요약:\n- " + results;
  await saveToLearningDB('naver', query, results);
  return summary;
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
let currentYear, currentMonth;

function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  renderCalendar(currentYear, currentMonth);

  // 버튼 이벤트 설정
  document.getElementById("prev-month")?.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  });

  document.getElementById("next-month")?.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  });
}

function renderCalendar(year, month) {
  const calendarGrid = document.getElementById("calendar-grid");
  if (!calendarGrid) {
    console.error("Calendar grid element not found");
    return;
  }

  calendarGrid.innerHTML = ""; // 기존 내용 초기화
  document.getElementById("calendar-title").textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 요일 헤더
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  daysOfWeek.forEach(day => {
    const dayElement = document.createElement("div");
    dayElement.textContent = day;
    dayElement.style.fontWeight = "bold";
    calendarGrid.appendChild(dayElement);
  });

  // 빈 날짜 채우기
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  // 날짜 채우기
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.textContent = day;
    dayElement.addEventListener("click", () => {
      const eventText = prompt(`${year}년 ${month + 1}월 ${day}일 일정을 입력하세요:`);
      if (eventText) {
        memoryStorage.save(`event_${year}_${month + 1}_${day}`, eventText);
        alert("일정이 저장되었습니다.");
        renderCalendar(year, month); // 일정 추가 후 캘린더 새로고침
      }
    });

    // 저장된 일정 표시
    const eventKey = `event_${year}_${month + 1}_${day}`;
    const eventText = memoryStorage.load(eventKey);
    if (eventText) {
      const eventSpan = document.createElement("span");
      eventSpan.textContent = ` - ${eventText}`;
      eventSpan.style.fontSize = "12px";
      eventSpan.style.color = "blue";
      dayElement.appendChild(eventSpan);
    }

    calendarGrid.appendChild(dayElement);
  }
}

function deleteCalendarEvent(day) {
  const eventKey = `event_${currentYear}_${currentMonth + 1}_${day}`;
  if (memoryStorage.load(eventKey)) {
    memoryStorage.save(eventKey, null);
    renderCalendar(currentYear, currentMonth); // 삭제 후 캘린더 새로고침
    return `${day}일의 일정이 삭제되었습니다.`;
  }
  return "삭제할 일정이 없습니다.";
}

function getCalendarEvents() {
  let events = "";
  for (let day = 1; day <= 31; day++) {
    const eventKey = `event_${currentYear}_${currentMonth + 1}_${day}`;
    const eventText = memoryStorage.load(eventKey);
    if (eventText) {
      events += `${day}일: ${eventText}\n`;
    }
  }
  return events || "현재 월에 일정이 없습니다.";
}

/***** 백엔드 API 호출 함수 *****/
async function getWeather(currentCity) {
  try {
    const position = await getUserLocation();
    const { latitude, longitude } = position;
    const cacheKey = `weather_${latitude}_${longitude}`;
    if (apiCache[cacheKey]) {
      return apiCache[cacheKey];
    }
    const response = await fetch(`${API_BASE_URL}/api/weather?lat=${latitude}&lon=${longitude}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    const currentWeather = data.description;
    const message = `현재 위치의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
    await logToServer("날씨 API 호출 성공");
    const result = { message, currentWeather };
    apiCache[cacheKey] = result;
    return result;
  } catch (error) {
    await logToServer(`날씨 API 호출 실패: ${error.message}`);
    console.warn("Geolocation failed, falling back to default city:", currentCity);
    const regionMap = {
      "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
      "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
      "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
      "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
      "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
    };
    const englishCity = regionMap[currentCity] || "Seoul";
    const cacheKey = `weather_${englishCity}`;
    if (apiCache[cacheKey]) {
      return apiCache[cacheKey];
    }
    const response = await fetch(`${API_BASE_URL}/api/weather?city=${encodeURIComponent(englishCity)}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    const currentWeather = data.description;
    const message = `오늘 ${currentCity}의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
    const result = { message, currentWeather };
    apiCache[cacheKey] = result;
    return result;
  }
}

async function getNaverSearchResults(query) {
  const cacheKey = `naver_${query}`;
  if (apiCache[cacheKey]) {
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

async function getYouTubeSearchResults(query) {
  const cacheKey = `youtube_${query}`;
  if (apiCache[cacheKey]) {
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

/***** 학습용 DB 저장 *****/
async function saveToLearningDB(type, query, results) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save-to-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, query, results })
    });
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    await logToServer(`${type} 데이터가 학습용 DB에 저장되었습니다.`);
    await updateEmbeddingsAndIntents();
  } catch (error) {
    await logToServer(`학습용 DB 저장 오류: ${error.message}`);
  }
}

/***** 날씨 효과 및 지역 변경 *****/
function updateWeatherEffects(currentWeather) {
  if (!currentWeather || typeof rainGroup === 'undefined' || typeof cloudRainGroup === 'undefined' || typeof houseCloudGroup === 'undefined') {
    console.warn("Weather effects not fully initialized");
    return;
  }
  if (currentWeather.includes("비") || currentWeather.includes("소나기")) {
    rainGroup.visible = true;
    cloudRainGroup.visible = true;
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

function updateLightning(currentWeather) {
  if (!currentWeather || typeof lightningLight === 'undefined') {
    console.warn("Lightning effect not initialized");
    return;
  }
  if (currentWeather.includes("번개") || currentWeather.includes("뇌우")) {
    if (Math.random() < 0.001) {
      lightningLight.intensity = 5;
      setTimeout(() => { lightningLight.intensity = 0; }, 100);
    }
  }
}

async function updateWeatherAndEffects(currentCity, sendMessage = true) {
  const weatherData = await getWeather(currentCity);
  if (sendMessage) {
    showSpeechBubbleInChunks(weatherData.message);
  }
  updateWeatherEffects(weatherData.currentWeather);
  return weatherData.currentWeather;
}

function changeRegion(value) {
  const currentCity = value;
  updateMap(currentCity);
  updateWeatherAndEffects(currentCity);
  const regionMap = {
    "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
    "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
    "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
    "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
    "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
  };
  const englishCity = regionMap[currentCity] || "Seoul";
  const message = `지역이 ${currentCity} (${englishCity})로 변경되었습니다.`;
  showSpeechBubbleInChunks(message);
  return currentCity;
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
      const chatInput = document.getElementById("chat-input");
      if (chatInput) {
        chatInput.value = transcript;
        sendChat();
      } else {
        console.error("Chat input element not found");
      }
    }
  };
  recognition.onerror = function(event) {
    console.error("음성 인식 오류:", event.error);
  };
}

/***** 대화 맥락 유지 *****/
function updateContext(intent) {
  const lastTopic = intent;
  memoryStorage.save("lastTopic", lastTopic);
  return lastTopic;
}

/***** 채팅 전송 및 파이프라인 처리 *****/
let lastChatTime = 0;
const chatCooldown = 1000;

async function sendChat() {
  const now = Date.now();
  if (now - lastChatTime < chatCooldown) {
    console.log("Chat is on cooldown");
    return;
  }
  lastChatTime = now;

  const inputEl = document.getElementById("chat-input");
  if (!inputEl) {
    console.error("Chat input element not found");
    return;
  }
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
  const regionMap = {
    "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
    "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
    "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
    "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
    "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
  };
  const regionList = Object.keys(regionMap);
  const processedData = await fetchAndUpdateKeywords();

  if (lowerInput.includes("일정 알려") || lowerInput.includes("일정 뭐") || lowerInput.includes("일정 보여")) {
    response = getCalendarEvents();
  } else if (lowerInput.includes("일정 삭제")) {
    const dayStr = prompt("삭제할 일정의 날짜(일)를 입력하세요 (예: 15):");
    if (dayStr) {
      const dayNum = parseInt(dayStr);
      response = deleteCalendarEvent(dayNum);
    } else {
      response = "삭제할 날짜를 입력하지 않으셨습니다.";
    }
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
      if (intent && (probabilities[intent] > 0.5 || intent !== 'unknown')) {
        if (intent === "greetings") {
          response = "안녕하세요! 만나서 반갑습니다. 오늘 하루 어떠셨나요?";
        } else if (intent === "sleep") {
          response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
        } else if (intent === "weather") {
          const weatherData = await getWeather(currentCity);
          response = weatherData.message;
        } else if (intent === "calendar") {
          response = getCalendarEvents();
        } else if (intent === "time") {
          const now = new Date();
          response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
        } else if (intent === "delete") {
          const dayStr = prompt("삭제할 일정의 날짜(일)를 입력하세요 (예: 15):");
          if (dayStr) {
            const dayNum = parseInt(dayStr);
            response = deleteCalendarEvent(dayNum);
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

/***** 말풍선 출력 *****/
function showSpeechBubbleInChunks(text, isHTML = false, chunkSize = 15, delay = 500) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) {
    console.error("Speech bubble element not found");
    return;
  }
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

/***** DOM 이벤트 처리 *****/
window.addEventListener("DOMContentLoaded", async function() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.setAttribute("list", "Charge");
    chatInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendChat();
    });
  } else {
    console.error("Chat input element not found on DOMContentLoaded");
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

  await fetchAndUpdateKeywords();
  await updateEmbeddingsAndIntents();

  const savedHistory = memoryStorage.load("conversationHistory");
  if (savedHistory) {
    historyEmbeddings = savedHistory.slice(-1).map(item => item.embedding);
  }
});

window.addEventListener("load", async () => {
  await loadIntentModel();
  try {
    initCalendar();
    updateMap("서울");
    await updateWeatherAndEffects("서울");
  } catch (err) {
    console.error("로드 이벤트 에러:", err);
  }
});

window.addEventListener("resize", function() {
  if (typeof camera !== 'undefined' && typeof renderer !== 'undefined') {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});
