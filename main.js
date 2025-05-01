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
  delete: ["하루일정 삭제", "하루일과 삭제해줘", "하루일과", "하루일저", "하루 일관"]
};

let intentWeightMatrix = {};
Object.keys(KEYWORDS).forEach(intent => {
  intentWeightMatrix[intent] = Array(300).fill(0.01); // 300차원 임베딩
});

const API_BASE_URL = 'https://emotionail2-0.onrender.com';
let gruHiddenState = Array(300).fill(0);
let historyEmbeddings = [];
let adaptiveLearningRate = 0.01;
let quantumBuffer = []; // 양자 벡터화 데이터 버퍼
let vectorizedKeywords; // 키워드의 양자 벡터화된 형태 저장
let vectorizedMongoDBData; // MongoDB 데이터의 양자 벡터화된 형태 저장

// 확장된 지식 그래프 (물리적 관계 포함)
const knowledgeGraph = {
  "넷플릭스": { concepts: ["드라마", "영화"], energy: 0.8, distance: 1.2 },
  "유튜브": { concepts: ["영상", "비디오"], energy: 0.9, distance: 1.0 },
  "날씨": { concepts: ["weather", "기온"], energy: 0.7, distance: 1.5 },
  "일정": { concepts: ["calendar", "스케줄"], energy: 0.6, distance: 1.8 }
};

const apiCache = {};

/***** 수학적 유틸리티 함수 *****/
function matrixMultiply(A, B) {
  const result = Array(A.length).fill().map(() => Array(B[0].length).fill(0));
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B[0].length; j++) {
      for (let k = 0; k < B.length; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

function vectorDot(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function vectorNorm(v) {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

function vectorAdd(a, b) {
  return a.map((val, i) => val + b[i]);
}

function vectorSubtract(a, b) {
  return a.map((val, i) => val - b[i]);
}

function vectorScale(v, scalar) {
  return v.map(val => val * scalar);
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function tanh(x) {
  return Math.tanh(x);
}

function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

/***** 물리 기반 유틸리티 함수 *****/
function computeEnergy(stateVector, mass = 1, velocity = 0.1) {
  const kinetic = 0.5 * mass * velocity * velocity;
  const potential = vectorNorm(stateVector) * 9.8; // 중력 가정
  return kinetic + potential;
}

function gradientDescentStep(vector, gradient, learningRate) {
  return vectorSubtract(vector, vectorScale(gradient, learningRate));
}

/***** 양자 벡터화 (Quantum Vectorization) *****/
function quantumVectorize(embedding) {
  const hBar = 1.0545718e-34; // 플랑크 상수
  const phase = embedding.map(x => Math.sin(x) * hBar); // 양자 위상
  const amplitude = embedding.map(x => Math.cos(x) * vectorNorm(embedding));
  return { phase, amplitude };
}

function quantumSuperposition(states) {
  const combinedPhase = states.reduce((acc, s) => vectorAdd(acc, s.phase), Array(300).fill(0));
  const combinedAmplitude = states.reduce((acc, s) => vectorAdd(acc, s.amplitude), Array(300).fill(0));
  return { phase: combinedPhase, amplitude: combinedAmplitude };
}

/***** MongoDB 데이터 처리 및 벡터화 *****/
async function fetchMongoDBData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mongodb-data`);
    if (!response.ok) throw new Error("MongoDB 데이터 가져오기 실패");
    const data = await response.json();
    const vectorizedData = await vectorizeMongoDBData(data);
    return vectorizedData;
  } catch (error) {
    console.error("MongoDB 데이터 처리 오류:", error);
    return null;
  }
}

async function vectorizeMongoDBData(data) {
  if (!Array.isArray(data)) data = [data];
  const vectorized = await Promise.all(data.map(async item => {
    const text = typeof item === 'string' ? item : JSON.stringify(item);
    const embedding = await getEmbedding(text);
    const qVec = quantumVectorize(embedding);
    return qVec.amplitude;
  }));
  return vectorized;
}

function processIntent(inputText, inputAmplitude, vectorizedData) {
  // 입력과 MongoDB 데이터 간의 유사도 계산
  const similarities = vectorizedData.map(dataAmp => vectorDot(inputAmplitude, dataAmp));
  const maxSimilarity = Math.max(...similarities);
  const bestMatchIndex = similarities.indexOf(maxSimilarity);
  return vectorizedData[bestMatchIndex];
}

/***** 모델 아키텍처 강화 *****/
function bidirectionalLSTM(sequence, units = 128) {
  const Wf = Array(units).fill().map(() => Array(sequence[0].length).fill(0.01));
  const Wb = Array(units).fill().map(() => Array(sequence[0].length).fill(0.01));
  let forwardState = Array(units).fill(0);
  let backwardState = Array(units).fill(0);

  for (let t = 0; t < sequence.length; t++) {
    const ft = sigmoid(vectorDot(Wf.map(row => vectorDot(row, sequence[t])), forwardState));
    forwardState = vectorScale(forwardState, ft);
  }
  for (let t = sequence.length - 1; t >= 0; t--) {
    const bt = sigmoid(vectorDot(Wb.map(row => vectorDot(row, sequence[t])), backwardState));
    backwardState = vectorScale(backwardState, bt);
  }
  return vectorAdd(forwardState, backwardState);
}

function selfAttention(embeddings, temperature = 1.0) {
  const energy = computeEnergy(embeddings);
  const scores = embeddings.map(e => vectorDot(e, embeddings) / (Math.sqrt(embeddings.length) * temperature));
  const weights = softmax(scores);
  return embeddings.map((e, i) => vectorScale(e, weights[i])).reduce((a, b) => vectorAdd(a, b));
}

function transformerEncoder(input, numHeads = 2) {
  const headSize = input.length / numHeads;
  const heads = [];
  for (let i = 0; i < numHeads; i++) {
    const head = input.slice(i * headSize, (i + 1) * headSize);
    heads.push(selfAttention(head));
  }
  const multiHeadOutput = [].concat(...heads);
  const ffWeights = Array(multiHeadOutput.length).fill().map(() => Array(multiHeadOutput.length).fill(0.01));
  const ffOutput = matrixMultiply([multiHeadOutput], ffWeights)[0];
  return vectorAdd(multiHeadOutput, ffOutput);
}

/***** MLP (수학적) *****/
function buildMLP(input, layers = [128, 64, Object.keys(intentWeightMatrix).length]) {
  let x = input;
  for (let i = 0; i < layers.length - 1; i++) {
    const weights = Array(layers[i]).fill().map(() => Array(x.length).fill(0.01));
    x = matrixMultiply([x], weights)[0].map(tanh);
  }
  const outputWeights = Array(layers[layers.length - 1]).fill().map(() => Array(x.length).fill(0.01));
  x = matrixMultiply([x], outputWeights)[0];
  return softmax(x);
}

/***** 슬롯 필링 *****/
function slotFilling(input, intent) {
  const slots = {};
  if (intent === "weather") {
    const city = input.match(/(\w+) 날씨/)?.[1];
    if (city) slots.city = city;
  } else if (intent === "calendar") {
    const date = input.match(/(\d{4}-\d{1,2}-\d{1,2})/)?.[1];
    if (date) slots.date = date;
  }
  return slots;
}

/***** 온라인/오프라인 파인튜닝 및 양자 벡터화 *****/
function collectQuantumData(embedding, intent) {
  const qState = quantumVectorize(embedding);
  quantumBuffer.push({ qState, intent });
  if (quantumBuffer.length >= 10) {
    batchQuantumUpdate();
  }
}

async function batchQuantumUpdate() {
  const batch = quantumBuffer.map(d => ({
    phase: d.qState.phase,
    amplitude: d.qState.amplitude,
    intent: d.intent
  }));
  quantumBuffer = [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/quantum-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch })
    });
    if (!response.ok) throw new Error("Quantum update failed");
    const updatedWeights = await response.json();
    Object.assign(intentWeightMatrix, updatedWeights);
  } catch (error) {
    console.error("Quantum batch update failed:", error);
  }
}

/***** API 호출 함수 *****/
async function processText(text) {
  if (!text || typeof text !== "string") return "";
  const response = await fetch(`${API_BASE_URL}/api/morph`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  const { analyzed } = await response.json();
  return analyzed ? analyzed.join(" ") : text;
}

async function getEmbedding(text) {
  const response = await fetch(`${API_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  const { embedding } = await response.json();
  return embedding || Array(300).fill(0);
}

async function getWeather(city) {
  const response = await fetch(`${API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
  const data = await response.json();
  return { message: `${city} 날씨: ${data.description}, ${data.temperature}°C` };
}

/***** 의도 분류기 *****/
async function intentClassifier(inputText, history) {
  const embedding = await getEmbedding(inputText);
  const qVec = quantumVectorize(embedding);
  const inputAmplitude = qVec.amplitude;

  // 키워드와의 양자 벡터화 기반 유사도 계산
  const intents = Object.keys(vectorizedKeywords);
  const maxDotsArray = intents.map(intent => {
    const keywordAmplitudes = vectorizedKeywords[intent];
    return Math.max(...keywordAmplitudes.map(kwAmp => vectorDot(inputAmplitude, kwAmp)));
  });
  const intentProbs = softmax(maxDotsArray);

  // 신경망에서 양자 벡터화된 입력 사용
  const sequence = history.concat([inputAmplitude]);
  const lstmOutput = bidirectionalLSTM(sequence);
  const mlpProbs = buildMLP(lstmOutput);

  const transOutput = transformerEncoder(inputAmplitude);
  const transProbs = softmax(transOutput.slice(0, intents.length));

  // 각 의도별 확률 평균 계산
  const averagedProbs = intents.map((_, i) => (intentProbs[i] + mlpProbs[i] + transProbs[i]) / 3);
  const finalIntent = intents[averagedProbs.indexOf(Math.max(...averagedProbs))];

  collectQuantumData(embedding, finalIntent);
  return { intent: finalIntent, amplitude: inputAmplitude, embedding };
}

/***** 메인 채팅 함수 *****/
async function sendChat() {
  const inputEl = document.getElementById("chat-input");
  if (!inputEl) return;
  const input = inputEl.value.trim();
  if (!input) return;

  const processedInput = await processText(input);
  const vectorizedData = await fetchMongoDBData();
  const { intent, amplitude, embedding } = await intentClassifier(processedInput, historyEmbeddings);
  const slots = slotFilling(input, intent);

  let response = "";
  if (intent === "weather") {
    const city = slots.city || "서울";
    const weatherData = await getWeather(city);
    response = weatherData.message;
  } else if (intent === "calendar") {
    response = getCalendarEvents(slots.date);
  } else if (vectorizedData) {
    const processedVector = processIntent(processedInput, amplitude, vectorizedData);
    response = `MongoDB 벡터 데이터: ${processedVector.slice(0, 5).join(", ")}...`;
  } else {
    response = "잘 이해하지 못했어요.";
  }

  showSpeechBubbleInChunks(response);
  historyEmbeddings.push(amplitude); // 양자 벡터화된 amplitude를 기록
  inputEl.value = "";
}

/***** 캘린더 및 UI 함수 *****/
function getCalendarEvents(dateStr) {
  const events = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
  return dateStr ? (events[dateStr] || "일정 없음") : Object.entries(events).map(([d, e]) => `${d}: ${e}`).join("\n") || "일정 없음";
}

function showSpeechBubbleInChunks(text) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) return;
  bubble.textContent = text;
  bubble.style.display = "block";
  setTimeout(() => bubble.style.display = "none", 3000);
}

/***** 초기화 *****/
async function initializeVectorizedKeywords() {
  vectorizedKeywords = {};
  for (const intent in KEYWORDS) {
    vectorizedKeywords[intent] = [];
    for (const keyword of KEYWORDS[intent]) {
      const embedding = await getEmbedding(keyword);
      const qVec = quantumVectorize(embedding);
      vectorizedKeywords[intent].push(qVec.amplitude);
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await initializeVectorizedKeywords();
  const input = document.getElementById("chat-input");
  if (input) input.addEventListener("keydown", e => e.key === "Enter" && sendChat());
});
