// API 키와 서버 URL 설정
const API_KEY = localStorage.getItem('API_KEY');
const SERVER_API_URL = 'https://emotionail2-0.onrender.com/api'; // 실제 서버 URL

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

/***** 학습용 데이터와 확장된 모델 정의 *****/

// 모델 파라미터 (다층 구조)
const inputSize = 300; // 입력 벡터 크기 (자모 단위 벡터)
const hidden1Size = 128; // 첫 번째 은닉층 뉴런 수
const hidden2Size = 64;  // 두 번째 은닉층 뉴런 수
const hidden3Size = 32;  // 세 번째 은닉층 뉴런 수
const intents = Object.keys(KEYWORDS); // 의도 목록
const outputSize = intents.length; // 출력 크기 (의도 수)

// He 초기화를 사용한 가중치 초기화 함수
function initHe(inSize, outSize) {
  const std = Math.sqrt(2 / inSize);
  return Array(outSize).fill().map(() => Array(inSize).fill(0).map(() => Math.random() * std - std / 2));
}

// zeros 함수
function zeros(size) {
  return Array(size).fill(0);
}

// 가중치 및 편향 초기화 (다층 구조)
let W1 = initHe(inputSize, hidden1Size), b1 = zeros(hidden1Size);
let W2 = initHe(hidden1Size, hidden2Size), b2 = zeros(hidden2Size);
let W3 = initHe(hidden2Size, hidden3Size), b3 = zeros(hidden3Size);
let W4 = initHe(hidden3Size, outputSize), b4 = zeros(outputSize);

// Adam 옵티마이저 변수 초기화
let mW1 = zeros(hidden1Size * inputSize), vW1 = zeros(hidden1Size * inputSize);
let mW2 = zeros(hidden2Size * hidden1Size), vW2 = zeros(hidden2Size * hidden1Size);
let mW3 = zeros(hidden3Size * hidden2Size), vW3 = zeros(hidden3Size * hidden2Size);
let mW4 = zeros(outputSize * hidden3Size), vW4 = zeros(outputSize * hidden3Size);
let mb1 = zeros(hidden1Size), vb1 = zeros(hidden1Size);
let mb2 = zeros(hidden2Size), vb2 = zeros(hidden2Size);
let mb3 = zeros(hidden3Size), vb3 = zeros(hidden3Size);
let mb4 = zeros(outputSize), vb4 = zeros(outputSize);
let t = 0; // 타임스텝

// Adam 하이퍼파라미터
const beta1 = 0.9, beta2 = 0.999, eps = 1e-8, lr = 0.001;

// 학습용 데이터 생성 함수
function generateDeepTrainingData(rawText) {
  const trainingData = [];
  const lines = rawText.split('\n').filter(line => line.trim());
  lines.forEach(line => {
    const [_, encodedText] = line.split(':');
    if (encodedText) {
      const decodedText = decodeLearningLines(encodedText);
      const vector = quantizeVector(vectorizeText(decodedText));
      const intent = detectIntentFromText(decodedText);
      const intentIndex = intents.indexOf(intent);
      const label = Array(outputSize).fill(0);
      if (intentIndex !== -1) label[intentIndex] = 1; // one-hot 인코딩
      trainingData.push({ input: new Float32Array(vector), label });
      if (!intentRecognitionGroup[intent]) intentRecognitionGroup[intent] = [];
      intentRecognitionGroup[intent].push(new Float32Array(vector));
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

// 활성화 함수 (LeakyReLU 사용)
function leakyRelu(x) {
  return x.map(v => v < 0 ? 0.01 * v : v);
}

function softmax(logits) {
  const exps = logits.map(Math.exp);
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// 배치 정규화 함수
function batchNorm(z, train = true, gamma = 1, beta = 0, movingMean = 0, movingVar = 1, momentum = 0.9) {
  if (train) {
    const mean = z.reduce((sum, v) => sum + v, 0) / z.length;
    const variance = z.reduce((sum, v) => sum + (v - mean) ** 2, 0) / z.length;
    const normalized = z.map(v => (v - mean) / Math.sqrt(variance + eps));
    movingMean = momentum * movingMean + (1 - momentum) * mean;
    movingVar = momentum * movingVar + (1 - momentum) * variance;
    return normalized.map(v => gamma * v + beta);
  } else {
    return z.map(v => (gamma * (v - movingMean)) / Math.sqrt(movingVar + eps) + beta);
  }
}

// 드롭아웃 함수
function dropout(x, rate = 0.2) {
  return x.map(v => Math.random() < rate ? 0 : v / (1 - rate));
}

// 행렬 연산 함수
function dot(x, W) {
  return W.map(row => row.reduce((sum, w, j) => sum + w * x[j], 0));
}

function addBias(z, b) {
  return z.map((v, i) => v + b[i]);
}

// 순전파 함수 (다층 구조)
function forwardDeep(x, train = true) {
  const z1 = addBias(dot(x, W1), b1);
  const bn1 = batchNorm(z1, train);
  const a1 = leakyRelu(bn1);
  const d1 = train ? dropout(a1, 0.2) : a1;

  const z2 = addBias(dot(d1, W2), b2);
  const bn2 = batchNorm(z2, train);
  const a2 = leakyRelu(bn2);
  const d2 = train ? dropout(a2, 0.2) : a2;

  const z3 = addBias(dot(d2, W3), b3);
  const bn3 = batchNorm(z3, train);
  const a3 = leakyRelu(bn3);
  const d3 = train ? dropout(a3, 0.2) : a3;

  const z4 = addBias(dot(d3, W4), b4);
  const out = softmax(z4);

  return { a1, a2, a3, out, bn1, bn2, bn3, d1, d2, d3 };
}

// 역전파 및 Adam 업데이트 함수
function backwardDeep(x, y, miniBatchSize = 32) {
  t++;
  const { a1, a2, a3, out, bn1, bn2, bn3, d1, d2, d3 } = forwardDeep(x, true);
  const grad4 = out.map((o, i) => o - y[i]); // 출력층 기울기
  const gradW4 = d3.map((d, i) => grad4.map(g => g * d)); // W4에 대한 기울기
  const gradB4 = grad4;

  const grad3 = W4.map(row => row.reduce((sum, w, j) => sum + w * grad4[j], 0)).map((v, i) => v * (a3[i] > 0 ? 1 : 0.01));
  const gradW3 = d2.map((d, i) => grad3.map(g => g * d));
  const gradB3 = grad3;

  const grad2 = W3.map(row => row.reduce((sum, w, j) => sum + w * grad3[j], 0)).map((v, i) => v * (a2[i] > 0 ? 1 : 0.01));
  const gradW2 = d1.map((d, i) => grad2.map(g => g * d));
  const gradB2 = grad2;

  const grad1 = W2.map(row => row.reduce((sum, w, j) => sum + w * grad2[j], 0)).map((v, i) => v * (a1[i] > 0 ? 1 : 0.01));
  const gradW1 = x.map((xi, i) => grad1.map(g => g * xi));
  const gradB1 = grad1;

  mW4 = mW4.map((m, i) => beta1 * m + (1 - beta1) * gradW4[Math.floor(i / hidden3Size)][i % hidden3Size]);
  vW4 = vW4.map((v, i) => beta2 * v + (1 - beta2) * (gradW4[Math.floor(i / hidden3Size)][i % hidden3Size] ** 2));
  const mHatW4 = mW4.map(m => m / (1 - beta1 ** t));
  const vHatW4 = vW4.map(v => v / (1 - beta2 ** t));
  W4 = W4.map((row, i) => row.map((w, j) => w - lr * mHatW4[i * hidden3Size + j] / (Math.sqrt(vHatW4[i * hidden3Size + j]) + eps)));

  mW3 = mW3.map((m, i) => beta1 * m + (1 - beta1) * gradW3[Math.floor(i / hidden2Size)][i % hidden2Size]);
  vW3 = vW3.map((v, i) => beta2 * v + (1 - beta2) * (gradW3[Math.floor(i / hidden2Size)][i % hidden2Size] ** 2));
  const mHatW3 = mW3.map(m => m / (1 - beta1 ** t));
  const vHatW3 = vW3.map(v => v / (1 - beta2 ** t));
  W3 = W3.map((row, i) => row.map((w, j) => w - lr * mHatW3[i * hidden2Size + j] / (Math.sqrt(vHatW3[i * hidden2Size + j]) + eps)));

  mW2 = mW2.map((m, i) => beta1 * m + (1 - beta1) * gradW2[Math.floor(i / hidden1Size)][i % hidden1Size]);
  vW2 = vW2.map((v, i) => beta2 * v + (1 - beta2) * (gradW2[Math.floor(i / hidden1Size)][i % hidden1Size] ** 2));
  const mHatW2 = mW2.map(m => m / (1 - beta1 ** t));
  const vHatW2 = vW2.map(v => v / (1 - beta2 ** t));
  W2 = W2.map((row, i) => row.map((w, j) => w - lr * mHatW2[i * hidden1Size + j] / (Math.sqrt(vHatW2[i * hidden1Size + j]) + eps)));

  mW1 = mW1.map((m, i) => beta1 * m + (1 - beta1) * gradW1[Math.floor(i / inputSize)][i % inputSize]);
  vW1 = vW1.map((v, i) => beta2 * v + (1 - beta2) * (gradW1[Math.floor(i / inputSize)][i % inputSize] ** 2));
  const mHatW1 = mW1.map(m => m / (1 - beta1 ** t));
  const vHatW1 = vW1.map(v => v / (1 - beta2 ** t));
  W1 = W1.map((row, i) => row.map((w, j) => w - lr * mHatW1[i * inputSize + j] / (Math.sqrt(vHatW1[i * inputSize + j]) + eps)));

  mb4 = mb4.map((m, i) => beta1 * m + (1 - beta1) * gradB4[i]);
  vb4 = vb4.map((v, i) => beta2 * v + (1 - beta2) * (gradB4[i] ** 2));
  const mHatb4 = mb4.map(m => m / (1 - beta1 ** t));
  const vHatb4 = vb4.map(v => v / (1 - beta2 ** t));
  b4 = b4.map((b, i) => b - lr * mHatb4[i] / (Math.sqrt(vHatb4[i]) + eps));

  mb3 = mb3.map((m, i) => beta1 * m + (1 - beta1) * gradB3[i]);
  vb3 = vb3.map((v, i) => beta2 * v + (1 - beta2) * (gradB3[i] ** 2));
  const mHatb3 = mb3.map(m => m / (1 - beta1 ** t));
  const vHatb3 = vb3.map(v => v / (1 - beta2 ** t));
  b3 = b3.map((b, i) => b - lr * mHatb3[i] / (Math.sqrt(vHatb3[i]) + eps));

  mb2 = mb2.map((m, i) => beta1 * m + (1 - beta1) * gradB2[i]);
  vb2 = vb2.map((v, i) => beta2 * v + (1 - beta2) * (gradB2[i] ** 2));
  const mHatb2 = mb2.map(m => m / (1 - beta1 ** t));
  const vHatb2 = vb2.map(v => v / (1 - beta2 ** t));
  b2 = b2.map((b, i) => b - lr * mHatb2[i] / (Math.sqrt(vHatb2[i]) + eps));

  mb1 = mb1.map((m, i) => beta1 * m + (1 - beta1) * gradB1[i]);
  vb1 = vb1.map((v, i) => beta2 * v + (1 - beta2) * (gradB1[i] ** 2));
  const mHatb1 = mb1.map(m => m / (1 - beta1 ** t));
  const vHatb1 = vb1.map(v => v / (1 - beta2 ** t));
  b1 = b1.map((b, i) => b - lr * mHatb1[i] / (Math.sqrt(vHatb1[i]) + eps));

  const loss = grad4.reduce((sum, e) => sum + e * e, 0) / outputSize;
  return loss;
}

// 학습 루프
function trainModel(data, epochs = 20, batchSize = 32) {
  let currentLr = lr;
  const decay = 0.95; // 학습률 감쇠율
  const losses = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    shuffle(data);
    let totalLoss = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      batch.forEach(sample => {
        const loss = backwardDeep(sample.input, sample.label);
        totalLoss += loss;
      });
    }
    const averageLoss = totalLoss / (data.length / batchSize);
    losses.push(averageLoss);
    console.log(`에포크 ${epoch + 1}/${epochs} 완료, 평균 손실: ${averageLoss.toFixed(4)}, 학습률: ${currentLr.toFixed(6)}`);
    currentLr *= decay; // 학습률 스케줄링
  }
  return losses;
}

// 데이터 셔플 함수
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 모델 저장
function saveDeepModel() {
  const model = { W1, b1, W2, b2, W3, b3, W4, b4, mW1, vW1, mW2, vW2, mW3, vW3, mW4, vW4, mb1, vb1, mb2, vb2, mb3, vb3, mb4, vb4 };
  localStorage.setItem('mlpModel', JSON.stringify(model));
  console.log("모델이 저장되었습니다.");
}

// 모델 로드
function loadDeepModel() {
  const savedModel = localStorage.getItem('mlpModel');
  if (savedModel) {
    const model = JSON.parse(savedModel);
    W1 = model.W1; b1 = model.b1;
    W2 = model.W2; b2 = model.b2;
    W3 = model.W3; b3 = model.b3;
    W4 = model.W4; b4 = model.b4;
    mW1 = model.mW1; vW1 = model.vW1;
    mW2 = model.mW2; vW2 = model.vW2;
    mW3 = model.mW3; vW3 = model.vW3;
    mW4 = model.mW4; vW4 = model.vW4;
    mb1 = model.mb1; vb1 = model.vb1;
    mb2 = model.mb2; vb2 = model.vb2;
    mb3 = model.mb3; vb3 = model.vb3;
    mb4 = model.mb4; vb4 = model.vb4;
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

/***** 텍스트 전처리 함수 *****/
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

function decodeLearningLines(encodedText) {
  return decodeURIComponent(escape(atob(encodedText)));
}

function updateIntentRecognitionGroup(text) {
  const vector = quantizeVector(vectorizeText(text));
  const intent = detectIntentFromText(text);
  if (!intentRecognitionGroup[intent]) intentRecognitionGroup[intent] = [];
  const binaryVector = new Float32Array(vector);
  intentRecognitionGroup[intent].push(binaryVector);
  console.log(`Intent '${intent}'에 벡터가 추가되었습니다.`);
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

/***** 채팅 처리 및 서버 통합 *****/
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
  const rawData = await readLearningFile();
  const trainingData = generateDeepTrainingData(rawData);
  const losses = trainModel(trainingData, 5, 32);
  saveDeepModel();

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
          const vector = quantizeVector(vectorizeText(trimmedSentence));
          const { out } = forwardDeep(vector, false);
          const predictedIntentIndex = out.indexOf(Math.max(...out));
          const predictedIntent = intents[predictedIntentIndex];
          response += `예측된 의도: ${predictedIntent} (확률: ${(out[predictedIntentIndex] * 100).toFixed(2)}%)\n`;
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

  loadDeepModel();

  const trainButton = document.getElementById("train-button");
  if (trainButton) {
    trainButton.addEventListener("click", async () => {
      const rawData = await readLearningFile();
      const trainingData = generateDeepTrainingData(rawData);
      const losses = trainModel(trainingData, 20, 32);
      saveDeepModel();
      console.log("학습 손실:", losses);
    });
  }
});
