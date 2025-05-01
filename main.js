// 백엔드는 MongoDB URI를 통해 데이터베이스 연결을 처리하며, 모든 데이터는 API 호출로 가져옵니다.

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
  calendar: ["일정 알려줘"],
  time: ["시간 알려줘"],
  delete: ["하루일정 삭제", "하루일과 삭제해줘", "하루일과", "하루일저", "하루 일관"],
  binary: ["이진데이터", "0101", "binary"] // 이진 데이터 처리용 키워드 추가
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
  "일정": ["calendar"],
  "이진데이터": ["binary"]
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

/***** 입력 필터링 함수 *****/
function filterInput(text) {
  const allowed = /[가-힣a-zA-Z0-1\s]/g; // 이진 데이터(0, 1)도 허용
  return (text.match(allowed) || []).join('');
}

/***** MongoDB 데이터 가져오기 및 벡터화 *****/
async function fetchMongoDBData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mongodb-data`);
    if (!response.ok) throw new Error("MongoDB 데이터 가져오기 실패");
    const data = await response.json();
    return vectorizeMongoDBData(data);
  } catch (error) {
    console.error("MongoDB 데이터 처리 오류:", error);
    return null;
  }
}

function vectorizeMongoDBData(data) {
  // MongoDB에서 가져온 데이터를 벡터화
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string' && /^[01]+$/.test(item)) {
        // 이진 데이터(예: "010101010101010")를 벡터화
        return item.split('').map(bit => bit === '0' ? 0 : 1).concat(Array(300 - item.length).fill(0));
      }
      return Array(300).fill(0).map(() => Math.random() * 0.01);
    });
  }
  return [Array(300).fill(0).map(() => Math.random() * 0.01)];
}

/***** 자모음 합치기 *****/
function combineJamo(binaryVector) {
  // 벡터화된 이진 데이터를 자모음으로 변환
  const jamoMap = {
    '0': 'ㄱ', // 초성
    '1': 'ㅏ'  // 중성
  };
  const binaryString = binaryVector.slice(0, 15).join(''); // "010101010101010" 길이에 맞춤
  let result = '';
  for (let i = 0; i < binaryString.length; i += 2) {
    const initial = jamoMap[binaryString[i]] || '';
    const vowel = jamoMap[binaryString[i + 1]] || '';
    result += initial + vowel;
  }
  return result || '알 수 없음';
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
      const keywords = item.keywords.map(kw => filterInput(kw.trim().toLowerCase())).slice(0, 50);
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
  const filteredText = filterInput(text);
  try {
    const response = await fetch(`${API_BASE_URL}/api/morph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: filteredText })
    });
    const { analyzed } = await response.json();
    return analyzed ? analyzed.join(' ') : filteredText;
  } catch (error) {
    console.error("형태소 분석 실패:", error);
    return filteredText;
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

/***** Softmax 의도 분류기 *****/
async function softmaxIntentClassifier(inputText, historyEmbeddings) {
  let maxJaccard = 0;
  let bestIntent = null;

  for (const intent in KEYWORDS) {
    const keywords = KEYWORDS[intent];
    let intentMaxJaccard = 0;
    for (const keyword of keywords) {
      const sim = jaccardSimilarity(inputText, keyword);
      if (sim > intentMaxJaccard) intentMaxJaccard = sim;
    }
    if (intentMaxJaccard > maxJaccard) {
      maxJaccard = intentMaxJaccard;
      bestIntent = intent;
    }
  }

  const inputEmbedding = await getEmbedding(inputText);
  if (maxJaccard >= 0.3) {
    const probabilities = {};
    for (const intent in KEYWORDS) {
      probabilities[intent] = intent === bestIntent ? 1 : 0;
    }
    return { intent: bestIntent, probabilities, embedding: inputEmbedding };
  } else {
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

/***** Embedding 및 Intent Vector 업데이트 *****/
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
      console.error("키 로드 오류:", key, e);
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

/***** 음성 출력 *****/
function speakText(text) {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.volume = 1;
    utterance.rate = 1.5;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("음성 출력 오류:", error);
  }
}

/***** 캘린더 관련 함수 *****/
let currentYear, currentMonth;
function deleteCalendarEvent(day) {
  if (typeof currentYear === 'undefined' || typeof currentMonth === 'undefined') {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
  }
  const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth + 1}-${day}`);
  if (eventDiv) {
    eventDiv.textContent = "";
    let calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
    delete calendarData[`${currentYear}-${currentMonth + 1}-${day}`];
    localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
    return `${currentYear}-${currentMonth + 1}-${day} 일정이 삭제되었습니다.`;
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
    if (typeof currentYear === 'undefined' || typeof currentMonth === 'undefined') {
      const now = new Date();
      currentYear = now.getFullYear();
      currentMonth = now.getMonth();
    }
    const currentMonthStr = `${currentYear}-${currentMonth + 1}`;
    let events = [];
    for (let key in calendarData) {
      if (key.startsWith(currentMonthStr)) {
        events.push(`${key}: ${calendarData[key]}`);
      }
    }
    return events.length ? `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}` : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
  }
}

/***** 백엔드 API 호출 함수 *****/
async function getWeather(currentCity) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/weather?city=${encodeURIComponent(currentCity)}`);
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    const currentWeather = data.description;
    const message = `오늘 ${currentCity}의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
    await logToServer("날씨 API 호출 성공");
    const result = { message, currentWeather };
    apiCache[`weather_${currentCity}`] = result;
    return result;
  } catch (error) {
    await logToServer(`날씨 API 호출 실패: ${error.message}`);
    return { message: "날씨 정보를 가져오지 못했습니다.", currentWeather: "unknown" };
  }
}

/***** 채팅 전송 및 파이프라인 처리 *****/
let lastChatTime = 0;
const chatCooldown = 1000;

async function sendChat() {
  const now = Date.now();
  if (now - lastChatTime < chatCooldown) {
    console.log("채팅이 쿨다운 상태입니다.");
    return;
  }
  lastChatTime = now;

  const inputEl = document.getElementById("chat-input");
  if (!inputEl) {
    console.error("채팅 입력 요소를 찾을 수 없습니다.");
    return;
  }
  const input = inputEl.value.trim();
  if (!input) return;

  let response = "";
  const processedInput = await processText(input);
  const lowerInput = processedInput.toLowerCase();
  let currentCity = "서울";
  const processedData = await fetchAndUpdateKeywords();

  const { intent, probabilities, embedding } = await softmaxIntentClassifier(lowerInput, historyEmbeddings);
  if (intent && (probabilities[intent] > 0.5 || intent !== 'unknown')) {
    if (intent === "greetings") {
      response = "안녕하세요! 반갑습니다.";
    } else if (intent === "sleep") {
      response = "좋은 꿈 꾸세요!";
    } else if (intent === "weather") {
      const weatherData = await getWeather(currentCity);
      response = weatherData.message;
    } else if (intent === "calendar") {
      response = getCalendarEvents();
    } else if (intent === "time") {
      const now = new Date();
      response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
    } else if (intent === "delete") {
      const dayStr = prompt("삭제할 날짜(일)를 입력하세요 (예: 15):");
      if (dayStr) {
        const dayNum = parseInt(dayStr);
        response = deleteCalendarEvent(dayNum);
      } else {
        response = "삭제할 날짜를 입력하지 않으셨습니다.";
      }
    } else if (intent === "binary") {
      const mongoData = await fetchMongoDBData();
      if (mongoData && mongoData.length > 0) {
        const binaryVector = mongoData[0]; // 첫 번째 데이터를 사용
        const combinedJamo = combineJamo(binaryVector);
        response = `MongoDB에서 가져온 이진 데이터 "010101010101010"을 자모음으로 변환한 결과: ${combinedJamo}`;
      } else {
        response = "MongoDB에서 이진 데이터를 가져오지 못했습니다.";
      }
    }
  } else {
    for (let site in SITE_LINKS) {
      if (lowerInput.includes(site)) {
        response = `${site} 사이트로 이동합니다!`;
        setTimeout(() => { window.location.href = SITE_LINKS[site]; }, 2000);
        break;
      }
    }
    if (!response) {
      response = "잘 이해하지 못했어요. 다시 말씀해 주세요.";
    }
  }

  showSpeechBubbleInChunks(response);
  updateConversationHistory(input, response, embedding);
  inputEl.value = "";
}

/***** 말풍선 출력 *****/
function showSpeechBubbleInChunks(text, chunkSize = 15, delay = 500) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) {
    console.error("말풍선 요소를 찾을 수 없습니다.");
    return;
  }
  bubble.style.opacity = 0;
  bubble.style.display = "block";
  let parts = [];
  for (let i = 0; i < text.length; i += chunkSize) parts.push(text.slice(i, i + chunkSize));
  let index = 0;
  bubble.textContent = "";

  function showNextPart() {
    if (index === 0) bubble.style.opacity = 1;
    if (index < parts.length) {
      bubble.textContent += parts[index];
      speakText(parts[index]);
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
    chatInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendChat();
    });
  }

  await fetchAndUpdateKeywords();
  await updateEmbeddingsAndIntents();

  const savedHistory = memoryStorage.load("conversationHistory");
  if (savedHistory) {
    historyEmbeddings = savedHistory.slice(-1).map(item => item.embedding);
  }
});
