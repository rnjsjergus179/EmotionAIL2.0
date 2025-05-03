// API 키와 서버 URL 설정
const API_KEY = localStorage.getItem('API_KEY');
const SERVER_API_URL = 'https://emotionail2-0.onrender.com/api'; // 실제 서버 URL로 교체 필요

/***** 사이트 링크와 키워드 정의 *****/
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
  time: ["시간 알려줘"],
  calendar: ["일정 알려줘", "오늘 일정", "이번 주 일정", "일정 확인", "일정 보여줘"],
  region: ["서울", "인천", "수원", "고양", "성남", "용인", "부천", "안양", "의정부", "광명", "안산", "파주", "부산", "대구", "광주", "대전", "울산", "제주", "전주", "청주", "포항", "여수", "김해"]
};

const API_BASE_URL = 'https://emotionail2-0.onrender.com';
let historyEmbeddings = [];
let adaptiveLearningRate = 0.01;

const knowledgeGraph = {
  "넷플릭스": ["드라마", "영화"],
  "유튜브": ["영상", "비디오"],
  "날씨": ["weather"],
  "일정": ["calendar"],
  "지역": ["region", "location", "city"]
};

const apiCache = {};

/***** 학습용 데이터와 모델 정의 *****/
const inputSize = 300; // 입력 벡터 크기 (자모 단위 벡터)
const hiddenSize = 64; // 은닉층 뉴런 수
const intents = Object.keys(KEYWORDS); // 의도 목록
const outputSize = intents.length; // 출력 크기 (의도 수)

// 가중치와 편향 초기화
let weights1 = Array.from({ length: hiddenSize }, () => Array(inputSize).fill(0).map(() => Math.random() * 0.01));
let bias1 = Array(hiddenSize).fill(0);
let weights2 = Array.from({ length: outputSize }, () => Array(hiddenSize).fill(0).map(() => Math.random() * 0.01));
let bias2 = Array(outputSize).fill(0);

// 활성화 함수
function relu(x) {
  return x.map(v => Math.max(0, v));
}

function softmax(logits) {
  const exps = logits.map(Math.exp);
  const sum = exps.reduce((a, b) => a + b);
  return exps.map(e => e / sum);
}

// 순전파 함수
function forward(input) {
  const z1 = weights1.map((w, i) => w.reduce((sum, wi, j) => sum + wi * input[j], bias1[i]));
  const a1 = relu(z1);
  const z2 = weights2.map((w, i) => w.reduce((sum, wi, j) => sum + wi * a1[j], bias2[i]));
  const a2 = softmax(z2);
  return { a1, a2 };
}

// 예측 함수
function predict(input) {
  const { a2 } = forward(input);
  const maxIndex = a2.indexOf(Math.max(...a2));
  return intents[maxIndex];
}

// 학습 함수 (역전파)
function train(input, target, lr = 0.01) {
  const { a1, a2 } = forward(input);
  const error = a2.map((o, i) => o - target[i]); // softmax + cross-entropy

  for (let i = 0; i < outputSize; i++) {
    for (let j = 0; j < hiddenSize; j++) {
      weights2[i][j] -= lr * error[i] * a1[j];
    }
    bias2[i] -= lr * error[i];
  }

  let hiddenError = Array(hiddenSize).fill(0);
  for (let j = 0; j < hiddenSize; j++) {
    for (let i = 0; i < outputSize; i++) {
      hiddenError[j] += error[i] * weights2[i][j];
    }
    hiddenError[j] *= (a1[j] > 0 ? 1 : 0); // ReLU 미분
  }

  for (let j = 0; j < hiddenSize; j++) {
    for (let k = 0; k < inputSize; k++) {
      weights1[j][k] -= lr * hiddenError[j] * input[k];
    }
    bias1[j] -= lr * hiddenError[j];
  }
}

// 학습 데이터 생성 함수 (학습용.txt 기반)
async function generateTrainingDataFromLearningFile() {
  const learningData = await readLearningFile();
  const lines = learningData.trim().split('\n');
  const trainingData = [];

  lines.forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 3) {
      const inputText = decodeURIComponent(escape(atob(parts[1])));
      const responseText = decodeURIComponent(escape(atob(parts[2])));
      const inputVector = vectorizeText(inputText);
      const target = Array(outputSize).fill(0);
      
      // 간단한 키워드 매핑으로 타겟 설정
      intents.forEach((intent, idx) => {
        if (KEYWORDS[intent].some(keyword => inputText.includes(keyword))) {
          target[idx] = 1;
        }
      });
      trainingData.push({ input: inputVector, label: target });
    }
  });

  return trainingData.length > 0 ? trainingData : [
    { input: Array(inputSize).fill(0).map(() => Math.random()), label: Array(outputSize).fill(0).map(() => Math.random()) }
  ];
}

// 학습 루프
async function trainEpochs(epochs = 10) {
  const data = await generateTrainingDataFromLearningFile();
  for (let epoch = 0; epoch < epochs; epoch++) {
    data.forEach(sample => {
      train(sample.input, sample.label, 0.01);
    });
    console.log(`에포크 ${epoch + 1}/${epochs} 완료`);
  }
}

// 모델 저장
function saveModel() {
  const model = { weights1, bias1, weights2, bias2 };
  localStorage.setItem('mlpModel', JSON.stringify(model));
  console.log("모델이 저장되었습니다.");
}

// 모델 로드
function loadModel() {
  const savedModel = localStorage.getItem('mlpModel');
  if (savedModel) {
    const model = JSON.parse(savedModel);
    weights1 = model.weights1;
    bias1 = model.bias1;
    weights2 = model.weights2;
    bias2 = model.bias2;
    console.log("모델이 로드되었습니다.");
  } else {
    console.log("저장된 모델이 없습니다.");
  }
}

/***** 유틸리티 함수 *****/
function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function averageVectors(vectors) {
  if (vectors.length === 0) return Array(300).fill(0);
  const sum = vectors.reduce((acc, vec) => acc.map((val, i) => val + vec[i]), Array(vectors[0].length).fill(0));
  return sum.map(val => val / vectors.length);
}

/***** 한국어 토큰화 및 필터링 *****/
function tokenizeAndFilter(text) {
  const cleanedText = text.replace(/[^가-힣a-zA-Z\s]/g, '');
  const hangulRange = /[\uAC00-\uD7AF]/g;
  const consonantsVowels = {
    initial: ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
    medial: ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'],
    final: ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
  };
  let tokens = [];
  cleanedText.split(' ').forEach(word => {
    if (/^[a-zA-Z]+$/.test(word)) {
      tokens.push({ type: 'english', value: word });
    } else if (hangulRange.test(word)) {
      for (let char of word) {
        const code = char.charCodeAt(0) - 0xAC00;
        if (code >= 0 && code <= 11171) {
          const initial = Math.floor(code / (21 * 28));
          const medial = Math.floor((code % (21 * 28)) / 28);
          const final = code % 28;
          tokens.push({ type: 'initial', value: consonantsVowels.initial[initial] });
          tokens.push({ type: 'medial', value: consonantsVowels.medial[medial] });
          if (final > 0) tokens.push({ type: 'final', value: consonantsVowels.final[final] });
        }
      }
    }
  });
  return tokens;
}

function recombineKorean(tokens) {
  let result = '';
  let buffer = [];
  for (let token of tokens) {
    if (token.type === 'english') {
      if (buffer.length) {
        result += recombineBuffer(buffer);
        buffer = [];
      }
      result += ' ' + token.value;
    } else {
      buffer.push(token);
    }
  }
  if (buffer.length) result += recombineBuffer(buffer);
  return result.trim();
}

function recombineBuffer(buffer) {
  let word = '';
  let i = 0;
  while (i < buffer.length) {
    if (buffer[i].type === 'initial' && i + 1 < buffer.length && buffer[i + 1].type === 'medial') {
      const initialIdx = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.indexOf(buffer[i].value) / 2;
      const medialIdx = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.indexOf(buffer[i + 1].value) / 2;
      let finalIdx = 0;
      if (i + 2 < buffer.length && buffer[i + 2].type === 'final') {
        finalIdx = 'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.indexOf(buffer[i + 2].value) / 2 + 1;
        i += 3;
      } else {
        i += 2;
      }
      const charCode = 0xAC00 + (initialIdx * 21 * 28) + (medialIdx * 28) + finalIdx;
      word += String.fromCharCode(charCode);
    } else {
      i++;
    }
  }
  return word;
}

/***** 서버와의 통신을 통한 학습용.txt 관리 *****/
async function appendToLearningFile(input, response) {
  const timestamp = Date.now();
  const encoded = `${timestamp}:${btoa(unescape(encodeURIComponent(input)))}:${btoa(unescape(encodeURIComponent(response)))}\n`;
  try {
    const res = await fetch(`${SERVER_API_URL}/append-to-learning-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': API_KEY
      },
      body: JSON.stringify({ data: encoded })
    });
    if (!res.ok) throw new Error('학습용.txt 파일에 추가 실패');
    console.log('데이터가 학습용.txt에 추가되었습니다.');
  } catch (error) {
    console.error('학습용.txt 파일 추가 중 오류:', error);
    const currentData = await readLearningFile();
    localStorage.setItem('learningData', currentData + encoded);
  }
}

async function readLearningFile() {
  try {
    const response = await fetch(`${SERVER_API_URL}/read-learning-file`, {
      method: 'GET',
      headers: { 'API_KEY': API_KEY }
    });
    if (!response.ok) throw new Error('학습용.txt 파일을 불러오지 못했습니다.');
    return await response.text();
  } catch (error) {
    console.error('학습용.txt 파일 불러오기 중 오류:', error);
    return localStorage.getItem('learningData') || '';
  }
}

/***** 텍스트 벡터화 및 양자화 *****/
function vectorizeText(text) {
  const tokens = tokenizeAndFilter(text);
  let vector = Array(300).fill(0);
  tokens.forEach((token, idx) => {
    const charCodeSum = token.value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    vector[idx % 300] += charCodeSum / 1000;
  });
  return vector;
}

function quantizeVector(vector) {
  return vector.map(val => Math.round(val * 100) / 100);
}

/***** API 호출 함수 *****/
async function fetchWithKeys(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'API_KEY': API_KEY, ...options.headers };
  return fetch(url, { ...options, headers });
}

async function getNaverSearchResults(query) {
  const cacheKey = `naver_${query}`;
  if (apiCache[cacheKey]) return apiCache[cacheKey];
  try {
    const response = await fetchWithKeys(`${API_BASE_URL}/api/naver-search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => item.title.replace(/<[^>]+>/g, '')).join('\n- ');
      apiCache[cacheKey] = results;
      return results;
    }
    return "검색 결과가 없습니다.";
  } catch (error) {
    console.error("네이버 검색 실패:", error);
    return "검색 결과를 가져오는데 실패했습니다.";
  }
}

async function getYouTubeSearchResults(query) {
  const cacheKey = `youtube_${query}`;
  if (apiCache[cacheKey]) return apiCache[cacheKey];
  try {
    const response = await fetchWithKeys(`${API_BASE_URL}/api/youtube-search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => `<a href="${item.url}" target="_blank">${item.title}</a>`).join('<br>');
      apiCache[cacheKey] = results;
      return results;
    }
    return "검색 결과가 없습니다.";
  } catch (error) {
    console.error("유튜브 검색 실패:", error);
    return "유튜브 검색 결과를 가져오는데 실패했습니다.";
  }
}

/***** 채팅 처리 *****/
async function sendChat() {
  const inputEl = document.getElementById("chat-input");
  if (!inputEl || !inputEl.value.trim()) return;
  const input = inputEl.value.trim();

  // 학습용.txt에서 검색
  const learningData = await readLearningFile();
  const lines = learningData.trim().split('\n');
  const matchedLine = lines.find(line => {
    const parts = line.split(':');
    if (parts.length >= 3) {
      const decodedInput = decodeURIComponent(escape(atob(parts[1])));
      return decodedInput === input;
    }
    return false;
  });

  let response = "";
  let isHTML = false;

  if (matchedLine) {
    const parts = matchedLine.split(':');
    response = decodeURIComponent(escape(atob(parts[2])));
  } else {
    // 검색 키워드 확인
    if (input.includes("유튜브")) {
      const query = input.replace(/유튜브|youtube|동영상|비디오|영상/gi, "").trim();
      response = query ? await getYouTubeSearchResults(query) : "유튜브 검색어를 입력해주세요.";
      isHTML = !!query;
    } else if (input.includes("네이버")) {
      const query = input.replace(/네이버|naver|검색|찾기/gi, "").trim();
      response = query ? await getNaverSearchResults(query) : "검색어를 입력해주세요.";
    } else {
      // 기본 응답
      response = "검색 결과가 없습니다.";
    }
    // 검색 결과를 학습용.txt에 저장
    await appendToLearningFile(input, response);
  }

  // 학습 데이터로 모델 업데이트
  const inputVector = vectorizeText(input);
  const predictedIntent = predict(inputVector);
  console.log(`예측된 의도: ${predictedIntent}`);

  showSpeechBubbleInChunks(response, isHTML);
  inputEl.value = "";
}

/***** 말풍선 표시 *****/
function showSpeechBubbleInChunks(text, isHTML = false, chunkSize = 15) {
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
      if (isHTML) bubble.innerHTML += parts[index] + "<br>";
      else bubble.textContent += parts[index];
      index++;
      requestAnimationFrame(showNextPart);
    } else {
      setTimeout(() => { bubble.style.opacity = 0; bubble.style.display = "none"; }, 2000);
    }
  }
  requestAnimationFrame(showNextPart);
}

/***** 지역 드롭다운 채우기 *****/
function populateRegionDropdown() {
  const regionSelect = document.getElementById("region-select");
  if (!regionSelect) {
    console.error("ID가 'region-select'인 요소를 찾을 수 없습니다.");
    return;
  }
  regionSelect.innerHTML = "";
  KEYWORDS.region.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });
}

/***** DOM 이벤트 처리 및 모델 초기화 *****/
window.addEventListener("DOMContentLoaded", () => {
  populateRegionDropdown();
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat();
    });
  }

  loadModel();

  // 학습 버튼 이벤트 추가 (필요 시 HTML에 <button id="train-button"> 추가)
  const trainButton = document.getElementById("train-button");
  if (trainButton) {
    trainButton.addEventListener("click", async () => {
      await trainEpochs(10);
      saveModel();
    });
  }
});
