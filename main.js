// API 키와 서버 URL 설정
const API_KEY = localStorage.getItem('API_KEY');
const SERVER_API_URL = 'https://emotionail2-0.onrender.com/api'; // 올바른 서버 URL

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

let intentRecognitionGroup = {};
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

// 모델 파라미터
const inputSize = 300; // 입력 벡터 크기 (자모 단위 벡터)
const hiddenSize = 64; // 은닉층 뉴런 수
const intents = Object.keys(KEYWORDS); // 의도 목록
const outputSize = intents.length; // 출력 크기 (의도 수)

// 가중치 초기화
let weights1 = Array(hiddenSize).fill().map(() => Array(inputSize).fill(0).map(() => Math.random() - 0.5));
let bias1 = Array(hiddenSize).fill(0);
let weights2 = Array(outputSize).fill().map(() => Array(hiddenSize).fill(0).map(() => Math.random() - 0.5));
let bias2 = Array(outputSize).fill(0);

// 학습용 데이터 생성 함수
function generateTrainingData() {
  const trainingData = [];
  intents.forEach((intent, index) => {
    if (intentRecognitionGroup[intent] && intentRecognitionGroup[intent].length > 0) {
      intentRecognitionGroup[intent].forEach(vector => {
        const label = Array(outputSize).fill(0);
        label[index] = 1; // one-hot 인코딩
        trainingData.push({ input: vector, label });
      });
    }
  });
  if (trainingData.length === 0) {
    console.log("학습 데이터가 부족하여 더미 데이터를 생성합니다.");
    trainingData.push(
      { input: new Float32Array(Array(inputSize).fill(0).map(() => Math.random())), label: [1, 0, 0, 0, 0, 0] },
      { input: new Float32Array(Array(inputSize).fill(0).map(() => Math.random())), label: [0, 1, 0, 0, 0, 0] },
      { input: new Float32Array(Array(inputSize).fill(0).map(() => Math.random())), label: [0, 0, 1, 0, 0, 0] }
    );
  }
  return trainingData;
}

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
  return { a1, z2, a2 };
}

// 학습 함수 (손실 계산 추가)
function train(input, target, lr = 0.01) {
  const { a1, z2, a2 } = forward(input);
  const error = a2.map((o, i) => o - target[i]);

  // 손실 계산 (평균 제곱 오차)
  const loss = error.reduce((sum, e) => sum + e * e, 0) / outputSize;

  // 출력층 업데이트
  for (let i = 0; i < outputSize; i++) {
    for (let j = 0; j < hiddenSize; j++) {
      weights2[i][j] -= lr * error[i] * a1[j];
    }
    bias2[i] -= lr * error[i];
  }

  // 은닉층 오류 계산
  let hiddenError = Array(hiddenSize).fill(0);
  for (let j = 0; j < hiddenSize; j++) {
    for (let i = 0; i < outputSize; i++) {
      hiddenError[j] += error[i] * weights2[i][j];
    }
    hiddenError[j] *= (a1[j] > 0 ? 1 : 0); // ReLU 미분
  }

  // 입력층 업데이트
  for (let j = 0; j < hiddenSize; j++) {
    for (let k = 0; k < inputSize; k++) {
      weights1[j][k] -= lr * hiddenError[j] * input[k];
    }
    bias1[j] -= lr * hiddenError[j];
  }

  return loss;
}

// 학습 루프 (손실 저장 및 출력)
function trainEpochs(data, epochs = 10, lr = 0.01) {
  const losses = [];
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    data.forEach(sample => {
      const loss = train(sample.input, sample.label, lr);
      totalLoss += loss;
    });
    const averageLoss = totalLoss / data.length;
    losses.push(averageLoss);
    console.log(`에포크 ${epoch + 1}/${epochs} 완료, 평균 손실: ${averageLoss.toFixed(4)}`);
  }
  return losses;
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
  const hangulRange = /[\uAC00-\uD7AF]/g;
  const consonantsVowels = {
    initial: ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
    medial: ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'],
    final: ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
  };
  let tokens = [];
  text.split(' ').forEach(word => {
    if (/[a-zA-Z]/.test(word)) {
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
      const initialIdx = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.indexOf(buffer[i].value);
      const medialIdx = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.indexOf(buffer[i + 1].value);
      let finalIdx = 0;
      if (i + 2 < buffer.length && buffer[i + 2].type === 'final') {
        finalIdx = 'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.indexOf(buffer[i + 2].value) + 1;
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
async function appendToLearningFile(input) {
  const timestamp = Date.now();
  const encoded = `${timestamp}:${btoa(unescape(encodeURIComponent(input)))}\n`;
  try {
    const response = await fetch(`${SERVER_API_URL}/append-to-learning-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': API_KEY
      },
      body: JSON.stringify({ data: encoded })
    });
    if (!response.ok) throw new Error('학습용.txt 파일에 추가 실패');
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
    const data = await response.text();
    return data;
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

function updateIntentRecognitionGroup(text) {
  const vector = quantizeVector(vectorizeText(text));
  const intent = detectIntentFromText(text);
  if (!intentRecognitionGroup[intent]) intentRecognitionGroup[intent] = [];
  const binaryVector = new Float32Array(vector);
  intentRecognitionGroup[intent].push(binaryVector);
}

/***** 의도 감지 *****/
function detectIntentFromText(input) {
  for (const intent in KEYWORDS) {
    if (KEYWORDS[intent].some(keyword => input.includes(keyword))) return intent;
  }
  return 'unknown';
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
      await appendToLearningFile(`Naver:${query}:${results}`);
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
      await appendToLearningFile(`YouTube:${query}:${results}`);
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

  // 다중 문장 분리 및 처리
  const sentences = input.split(/[.!?]/).filter(s => s.trim());

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    await appendToLearningFile(trimmedSentence);
    updateIntentRecognitionGroup(trimmedSentence);
  }

  // 실시간 재학습
  const trainingData = generateTrainingData();
  const losses = trainEpochs(trainingData, 5, 0.01); // 에포크 수와 학습률 조정 가능
  saveModel();

  // 손실 시각화 (콘솔 출력)
  console.log("학습 손실:", losses);

  let response = "";
  let isHTML = false;
  let shouldNavigate = false;
  let navigateUrl = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    const matchedRegion = KEYWORDS.region.find(region => trimmedSentence.includes(region));
    if (matchedRegion) {
      changeRegion(matchedRegion);
      response += `지역을 ${matchedRegion}으로 변경했습니다.\n`;
    } else {
      for (let site in SITE_LINKS) {
        if (trimmedSentence.includes(site)) {
          if (site === "유튜브") {
            const query = trimmedSentence.replace(/유튜브|youtube|동영상|비디오|영상/gi, "").trim();
            response += query ? await getYouTubeSearchResults(query) : "유튜브 검색어를 입력해주세요.\n";
            isHTML = !!query;
          } else if (site === "네이버") {
            const query = trimmedSentence.replace(/네이버|naver|검색|찾기/gi, "").trim();
            response += query ? await getNaverSearchResults(query) : "검색어를 입력해주세요.\n";
          } else {
            response += `${site} 사이트로 이동합니다!\n`;
            shouldNavigate = true;
            navigateUrl = SITE_LINKS[site];
          }
          break;
        }
      }

      if (!response) {
        const intent = detectIntentFromText(trimmedSentence);
        if (intent === "greetings") response += "안녕하세요!\n";
        else if (intent === "sleep") response += "좋은 꿈 꾸세요!\n";
        else if (intent === "time") {
          const now = new Date();
          response += `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.\n`;
        } else {
          // 모델을 사용한 예측
          const vector = quantizeVector(vectorizeText(trimmedSentence));
          const { a2 } = forward(vector);
          const predictedIntentIndex = a2.indexOf(Math.max(...a2));
          const predictedIntent = intents[predictedIntentIndex];
          response += `예측된 의도: ${predictedIntent}\n`;
        }
      }
    }
  }

  showSpeechBubbleInChunks(response, isHTML);
  if (shouldNavigate) setTimeout(() => { window.location.href = navigateUrl; }, 2000);
  inputEl.value = "";
}

/***** 지역 변경 함수 *****/
function changeRegion(region) {
  const regionSelect = document.getElementById("region-select");
  if (regionSelect) {
    regionSelect.value = region;
    console.log(`지역이 ${region}으로 변경되었습니다.`);
  }
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

  const trainButton = document.getElementById("train-button");
  if (trainButton) {
    trainButton.addEventListener("click", () => {
      const trainingData = generateTrainingData();
      const losses = trainEpochs(trainingData, 10, 0.01);
      saveModel();
      console.log("학습 손실:", losses);
    });
  }
});
