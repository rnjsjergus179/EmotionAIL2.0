// Updated client‑side script for EmotionAIL 2.0
//
// This version addresses issues discovered in the original main.js:
//   * The client now calls the correct API endpoints defined on the server
//     (`/append-to-learning-file` and `/read-learning-file`).
//   * Authentication uses an `api_key` header rather than an Authorization
//     header, matching the server implementation.
//   * Reading 학습용.txt is done via HTTP instead of attempting to fetch
//     a local file directly.
//   * Deprecated functions (`unescape`) have been removed in favour of
//     modern equivalents (encodeURIComponent/ decodeURIComponent).

/* --------------------------------------------------------------------------
 *  Configuration
 *
 * API_KEY: your API key used to authenticate requests to the server.  It is
 * retrieved from localStorage to avoid hard‑coding secrets in the script.  If
 * no key is found a placeholder string is used; be sure to set
 * localStorage.setItem('API_KEY', 'your-key') before making API calls.
 *
 * SERVER_URL: the base URL of your backend server.  Requests will be
 * constructed relative to this value.
 */
const API_KEY = localStorage.getItem('API_KEY') || 'default-api-key';
const SERVER_URL = 'https://emotionail2-0-u1qe.onrender.com';

// Path to the learning file on the server.  This value is only used when
// constructing the read endpoint; browsers cannot fetch local files from the
// filesystem.
const LEARNING_FILE_ENDPOINT = `${SERVER_URL}/read-learning-file`;

// Keywords used for intent detection
let 키워드 = {
  인사: ['안녕', '안녕하세요', '안녕 하세', '안녕하시오', '안녕한갑네', '반가워'],
  취침: ['잘자', '좋은꿈', '좋은 꿈', '잘자요', '잘자시게', '잘자리요', '잘자라니께'],
  날씨: ['날씨알려줘', '날씨알려주게', '날씨좀알려줘', '날씨 알려줘', '날씨 좀 알려줘', '날씨 어때', '날씨 맑아'],
  시간: ['시간 알려줘'],
  일정: ['일정 알려줘', '오늘 일정', '이번 주 일정', '일정 확인', '일정 보여줘'],
  지역: [
    '서울', '인천', '수원', '고양', '성남', '용인', '부천', '안양', '의정부', '광명', '안산',
    '파주', '부산', '대구', '광주', '대전', '울산', '제주', '전주', '청주', '포항', '여수', '김해'
  ]
};

let 의도_인식_그룹 = {};
const 단어_사전 = {};
let 단어_인덱스 = 0;

function 단어_임베딩(단어) {
  if (!단어_사전[단어]) {
    단어_사전[단어] = 단어_인덱스++;
  }
  return 단어_사전[단어];
}

function 단어_토큰화(텍스트) {
  return 텍스트.split(' ').filter(token => token.trim() !== '');
}

function 텍스트_벡터화(텍스트) {
  const 토큰 = 단어_토큰화(텍스트);
  const 벡터 = Array(300).fill(0);
  토큰.forEach(단어 => {
    const 인덱스 = 단어_임베딩(단어) % 300;
    벡터[인덱스] += 1;
  });
  return new Float32Array(벡터);
}

function 텍스트_정제(텍스트) {
  return 텍스트.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();
}

// Model hyperparameters
const 입력_크기 = 300;
const 은닉_크기 = 64;
const 의도 = Object.keys(키워드);
const 출력_크기 = 의도.length;

// Initialize weights and biases
let 가중치1 = Array.from({ length: 은닉_크기 }, () =>
  Array(입력_크기)
    .fill(0)
    .map(() => Math.random() * 0.01)
);
let 편향1 = Array(은닉_크기).fill(0);
let 가중치2 = Array.from({ length: 출력_크기 }, () =>
  Array(은닉_크기)
    .fill(0)
    .map(() => Math.random() * 0.01)
);
let 편향2 = Array(출력_크기).fill(0);

function loadModel() {
  const raw = localStorage.getItem('mlp모델');
  if (!raw) {
    console.warn('저장된 모델이 없습니다.');
    return false;
  }
  const { 가중치1: w1, 편향1: b1, 가중치2: w2, 편향2: b2 } = JSON.parse(raw);
  가중치1 = w1;
  편향1 = b1;
  가중치2 = w2;
  편향2 = b2;
  console.log('MLP 모델이 로드되었습니다.');
  return true;
}

function 학습_데이터_생성() {
  const 학습_데이터 = [];
  의도.forEach((intent, index) => {
    if (의도_인식_그룹[intent] && 의도_인식_그룹[intent].length > 0) {
      의도_인식_그룹[intent].forEach(텍스트 => {
        const vector = 텍스트_벡터화(텍스트);
        const 라벨 = Array(출력_크기).fill(0);
        라벨[index] = 1;
        학습_데이터.push({ 입력: vector, 라벨 });
      });
    }
  });
  if (학습_데이터.length === 0) {
    // Generate dummy data when no samples are available
    console.log('학습 데이터가 부족하여 더미 데이터를 생성합니다.');
    학습_데이터.push(
      { 입력: new Float32Array(Array(입력_크기).fill(0).map(() => Math.random())), 라벨: [1, 0, 0, 0, 0, 0] },
      { 입력: new Float32Array(Array(입력_크기).fill(0).map(() => Math.random())), 라벨: [0, 1, 0, 0, 0, 0] },
      { 입력: new Float32Array(Array(입력_크기).fill(0).map(() => Math.random())), 라벨: [0, 0, 1, 0, 0, 0] }
    );
  }
  return 학습_데이터;
}

function 렐루(x) {
  return x.map(v => Math.max(0, v));
}

function 소프트맥스(로짓) {
  const exp = 로짓.map(Math.exp);
  const 합 = exp.reduce((a, b) => a + b);
  return exp.map(e => e / 합);
}

function 순전파(입력) {
  const z1 = 가중치1.map((w, i) => w.reduce((sum, wi, j) => sum + wi * 입력[j], 편향1[i]));
  const a1 = 렐루(z1);
  const z2 = 가중치2.map((w, i) => w.reduce((sum, wi, j) => sum + wi * a1[j], 편향2[i]));
  const a2 = 소프트맥스(z2);
  return { a1, a2 };
}

function 학습(입력, 목표, 학습률 = 0.01) {
  const { a1, a2 } = 순전파(입력);
  const 오류 = a2.map((o, i) => o - 목표[i]);
  for (let i = 0; i < 출력_크기; i++) {
    for (let j = 0; j < 은닉_크기; j++) {
      가중치2[i][j] -= 학습률 * 오류[i] * a1[j];
    }
    편향2[i] -= 학습률 * 오류[i];
  }
  let 은닉_오류 = Array(은닉_크기).fill(0);
  for (let j = 0; j < 은닉_크기; j++) {
    for (let i = 0; i < 출력_크기; i++) {
      은닉_오류[j] += 오류[i] * 가중치2[i][j];
    }
    은닉_오류[j] *= a1[j] > 0 ? 1 : 0;
  }
  for (let j = 0; j < 은닉_크기; j++) {
    for (let k = 0; k < 입력_크기; k++) {
      가중치1[j][k] -= 학습률 * 은닉_오류[j] * 입력[k];
    }
    편향1[j] -= 학습률 * 은닉_오류[j];
  }
}

function 에포크_학습(데이터, 에포크 = 10) {
  for (let epoch = 0; epoch < 에포크; epoch++) {
    데이터.forEach(샘플 => {
      학습(샘플.입력, 샘플.라벨, 0.01);
    });
    console.log(`에포크 ${epoch + 1}/${에포크} 완료`);
  }
  모델_저장();
}

function 모델_저장() {
  const 모델 = {
    가중치1,
    편향1,
    가중치2,
    편향2
  };
  localStorage.setItem('mlp모델', JSON.stringify(모델));
  console.log('모델이 저장되었습니다.');
}

/* --------------------------------------------------------------------------
 *  Backend API wrappers
 */

async function sendLearningData(data) {
  try {
    const response = await fetch(`${SERVER_URL}/append-to-learning-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_key: API_KEY
      },
      body: JSON.stringify({ data })
    });
    if (!response.ok) throw new Error('학습용 데이터 전송 실패');
    console.log('학습용 데이터가 서버에 전송되었습니다.');
  } catch (error) {
    console.error('학습용 데이터 전송 중 오류:', error);
  }
}

async function readLearningFile() {
  try {
    const response = await fetch(LEARNING_FILE_ENDPOINT);
    if (!response.ok) throw new Error('학습용.txt 파일을 읽지 못했습니다.');
    return await response.text();
  } catch (error) {
    console.error('학습용.txt 파일 읽기 중 오류:', error);
    return '';
  }
}

async function 학습_파일에_추가(입력) {
  const 타임스탬프 = Date.now();
  const 인코딩 = `${타임스탬프}:${btoa(encodeURIComponent(입력))}\n`;
  // Fetch current contents of the learning file
  let 현재_데이터 = await readLearningFile();
  현재_데이터 += 인코딩;
  // Send the updated file back to the server
  await sendLearningData(현재_데이터);
  console.log('데이터가 학습용.txt에 추가되었습니다.');
}

/* --------------------------------------------------------------------------
 *  Intent recognition and chat handling
 */

function 의도_인식_그룹_업데이트(텍스트) {
  const intent = 텍스트에서_의도_감지(텍스트);
  if (!의도_인식_그룹[intent]) 의도_인식_그룹[intent] = [];
  의도_인식_그룹[intent].push(텍스트);
  console.log(`의도: ${intent}, 텍스트: ${텍스트}`);
}

function 텍스트에서_의도_감지(입력) {
  for (const intent in 키워드) {
    if (키워드[intent].some(kw => 입력.includes(kw))) return intent;
  }
  return '알수없음';
}

async function 채팅_전송() {
  const 입력_요소 = document.getElementById('chat-input');
  if (!입력_요소 || !입력_요소.value.trim()) return;
  const 입력 = 입력_요소.value.trim();
  await 학습_파일에_추가(입력);
  의도_인식_그룹_업데이트(입력);
  const 학습_데이터_텍스트 = await readLearningFile();
  const 학습_데이터_라인 = 학습_데이터_텍스트.split('\n').filter(line => line);
  if (학습_데이터_라인.length > 0) {
    const 최신_라인 = 학습_데이터_라인[학습_데이터_라인.length - 1];
    const [, 인코딩] = 최신_라인.split(':');
    const 디코딩_텍스트 = decodeURIComponent(atob(인코딩));
    const 정제_텍스트 = 텍스트_정제(디코딩_텍스트);
    const 토큰 = 단어_토큰화(정제_텍스트);
    const 단어_출력 = 토큰.join(' ');
    말풍선_표시(단어_출력);
  }
  // Trigger training once per message
  const 학습_데이터 = 학습_데이터_생성();
  if (학습_데이터.length > 0) {
    에포크_학습(학습_데이터, 1);
  }
  입력_요소.value = '';
}

function 말풍선_표시(텍스트, 청크_크기 = 15) {
  const 풍선 = document.getElementById('speech-bubble');
  if (!풍선) return;
  풍선.style.opacity = 0;
  풍선.style.display = 'block';
  const 부분 = [];
  for (let i = 0; i < 텍스트.length; i += 청크_크기) 부분.push(텍스트.slice(i, i + 청크_크기));
  let 인덱스 = 0;
  풍선.textContent = '';
  function 다음_부분_표시() {
    if (인덱스 === 0) 풍선.style.opacity = 1;
    if (인덱스 < 부분.length) {
      풍선.textContent += 부분[인덱스];
      인덱스++;
      requestAnimationFrame(다음_부분_표시);
    } else {
      setTimeout(() => {
        풍선.style.opacity = 0;
        풍선.style.display = 'none';
      }, 2000);
    }
  }
  requestAnimationFrame(다음_부분_표시);
}

function 지역_변경(지역) {
  const 지역_선택 = document.getElementById('region-select');
  if (지역_선택) {
    지역_선택.value = 지역;
    console.log(`지역이 ${지역}으로 변경되었습니다.`);
  }
}

function 지역_드롭다운_채우기() {
  const 지역_선택 = document.getElementById('region-select');
  if (!지역_선택) {
    console.error("ID가 'region-select'인 요소를 찾을 수 없습니다.");
    return;
  }
  지역_선택.innerHTML = '';
  키워드.지역.forEach(지역 => {
    const 옵션 = document.createElement('option');
    옵션.value = 지역;
    옵션.textContent = 지역;
    지역_선택.appendChild(옵션);
  });
}

// Set up DOM events and load saved model
window.addEventListener('DOMContentLoaded', async () => {
  지역_드롭다운_채우기();
  const 채팅_입력 = document.getElementById('chat-input');
  if (채팅_입력) {
    채팅_입력.addEventListener('keydown', async e => {
      if (e.key === 'Enter') await 채팅_전송();
    });
  }
  loadModel();
  // Initialise intent groups from existing learning file
  const 학습_데이터_텍스트 = await readLearningFile();
  const 학습_데이터_라인 = 학습_데이터_텍스트.split('\n');
  학습_데이터_라인.forEach(라인 => {
    if (라인) {
      const [, 인코딩] = 라인.split(':');
      const 텍스트 = decodeURIComponent(atob(인코딩));
      의도_인식_그룹_업데이트(텍스트);
    }
  });
});