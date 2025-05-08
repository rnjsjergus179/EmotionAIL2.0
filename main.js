// 백엔드 환경변수 활용 설정
const RENDER_KEY = localStorage.getItem('RENDER_KEY') || 'default-render-key'; // 백엔드 인증 키
const ALLOWED_ORIGIN = 'https://emotionail2-0-u1qe.onrender.com'; // 허용된 출처
const 서버_API_URL = `${ALLOWED_ORIGIN}/api`; // 서버 엔드포인트 URL

// 학습용.txt 파일 경로 (깃허브 정적 루트 디렉토리)
const 학습용_파일_경로 = './학습용.txt';

// 키워드 정의
let 키워드 = {
  인사: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네", "반가워"],
  취침: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
  날씨: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
  시간: ["시간 알려줘"],
  일정: ["일정 알려줘", "오늘 일정", "이번 주 일정", "일정 확인", "일정 보여줘"],
  지역: ["서울", "인천", "수원", "고양", "성남", "용인", "부천", "안양", "의정부", "광명", "안산", "파주", "부산", "대구", "광주", "대전", "울산", "제주", "전주", "청주", "포항", "여수", "김해"]
};

let 의도_인식_그룹 = {};

// 단어 임베딩을 위한 간단한 사전
const 단어_사전 = {};
let 단어_인덱스 = 0;

// 단어 임베딩 함수
function 단어_임베딩(단어) {
  if (!단어_사전[단어]) {
    단어_사전[단어] = 단어_인덱스++;
  }
  return 단어_사전[단어];
}

// 텍스트를 단어 단위로 토큰화
function 단어_토큰화(텍스트) {
  return 텍스트.split(' ').filter(token => token.trim() !== '');
}

// 텍스트를 벡터화 (단어 임베딩 사용)
function 텍스트_벡터화(텍스트) {
  const 토큰 = 단어_토큰화(텍스트);
  const 벡터 = Array(300).fill(0);
  토큰.forEach(단어 => {
    const 인덱스 = 단어_임베딩(단어) % 300;
    벡터[인덱스] += 1;
  });
  return new Float32Array(벡터);
}

// 학습용 텍스트 정제 함수
function 텍스트_정제(텍스트) {
  return 텍스트.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();
}

/***** 학습용 데이터와 모델 정의 *****/
const 입력_크기 = 300; // 300차원 벡터
const 은닉_크기 = 64; // 은닉층 뉴런 수
const 의도 = Object.keys(키워드); // 의도 목록
const 출력_크기 = 의도.length; // 출력 크기 (의도 수)

// 가중치와 편향 초기화
let 가중치1 = Array.from({ length: 은닉_크기 }, () => Array(입력_크기).fill(0).map(() => Math.random() * 0.01));
let 편향1 = Array(은닉_크기).fill(0);
let 가중치2 = Array.from({ length: 출력_크기 }, () => Array(은닉_크기).fill(0).map(() => Math.random() * 0.01));
let 편향2 = Array(출력_크기).fill(0);

// 모델 로드 함수
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

// 학습용 데이터 생성 함수
function 학습_데이터_생성() {
  const 학습_데이터 = [];
  의도.forEach((intent, index) => {
    if (의도_인식_그룹[intent] && 의도_인식_그룹[intent].length > 0) {
      의도_인식_그룹[intent].forEach(텍스트 => {
        const vector = 텍스트_벡터화(텍스트);
        const 라벨 = Array(출력_크기).fill(0);
        라벨[index] = 1; // 원-핫 인코딩
        학습_데이터.push({ 입력: vector, 라벨 });
      });
    }
  });
  if (학습_데이터.length === 0) {
    console.log("학습 데이터가 부족하여 더미 데이터를 생성합니다.");
    학습_데이터.push(
      { 입력: new Float32Array(Array(입력_크기).fill(0).map(() => Math.random())), 라벨: [1, 0, 0, 0, 0, 0] },
      { 입력: new Float32Array(Array(입력_크기).fill(0).map(() => Math.random())), 라벨: [0, 1, 0, 0, 0, 0] },
      { 입력: new Float32Array(Array(입력_크기).fill(0).map(() => Math.random())), 라벨: [0, 0, 1, 0, 0, 0] }
    );
  }
  return 학습_데이터;
}

// 활성화 함수
function 렐루(x) {
  return x.map(v => Math.max(0, v));
}

function 소프트맥스(로짓) {
  const exp = 로짓.map(Math.exp);
  const 합 = exp.reduce((a, b) => a + b);
  return exp.map(e => e / 합);
}

// 순전파 함수
function 순전파(입력) {
  const z1 = 가중치1.map((w, i) => w.reduce((sum, wi, j) => sum + wi * 입력[j], 편향1[i]));
  const a1 = 렐루(z1);
  const z2 = 가중치2.map((w, i) => w.reduce((sum, wi, j) => sum + wi * a1[j], 편향2[i]));
  const a2 = 소프트맥스(z2);
  return { a1, a2 };
}

// 학습 함수 (역전파)
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
    은닉_오류[j] *= (a1[j] > 0 ? 1 : 0);
  }

  for (let j = 0; j < 은닉_크기; j++) {
    for (let k = 0; k < 입력_크기; k++) {
      가중치1[j][k] -= 학습률 * 은닉_오류[j] * 입력[k];
    }
    편향1[j] -= 학습률 * 은닉_오류[j];
  }
}

// 학습 루프
function 에포크_학습(데이터, 에포크 = 10) {
  for (let epoch = 0; epoch < 에포크; epoch++) {
    데이터.forEach(샘플 => {
      학습(샘플.입력, 샘플.라벨, 0.01);
    });
    console.log(`에포크 ${epoch + 1}/${에포크} 완료`);
  }
  모델_저장();
}

// 모델 저장 (로컬)
function 모델_저장() {
  const 모델 = {
    가중치1: 가중치1,
    편향1: 편향1,
    가중치2: 가중치2,
    편향2: 편향2
  };
  localStorage.setItem('mlp모델', JSON.stringify(모델));
  console.log("모델이 저장되었습니다.");
}

/***** 백엔드 API 호출 함수 (학습용.txt 관련) *****/
async function 학습용_데이터_전송(데이터) {
  try {
    const 응답 = await fetch(`${서버_API_URL}/save-learning-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RENDER_KEY}`, // RENDER_KEY를 헤더에 사용
        'Origin': ALLOWED_ORIGIN // ALLOWED_ORIGIN 설정
      },
      body: JSON.stringify({ data: 데이터 })
    });
    if (!응답.ok) throw new Error('학습용 데이터 전송 실패');
    console.log('학습용 데이터가 서버에 전송되었습니다.');
  } catch (error) {
    console.error('학습용 데이터 전송 중 오류:', error);
  }
}

/***** 학습용.txt 파일 관리 (fetch를 사용한 파일 읽기/쓰기) *****/
async function 학습_파일에_추가(입력) {
  const 타임스탬프 = Date.now();
  const 인코딩 = `${타임스탬프}:${btoa(unescape(encodeURIComponent(입력)))}\n`;

  // 학습용.txt 파일을 서버에서 읽어오기
  let 현재_데이터 = await 학습_파일_읽기();

  // 새로운 데이터 추가
  현재_데이터 += 인코딩;

  // 서버에 업데이트된 데이터 전송
  await 학습용_데이터_전송(현재_데이터);
  console.log('데이터가 학습용.txt에 추가되었습니다.');
}

async function 학습_파일_읽기() {
  try {
    const 응답 = await fetch(학습용_파일_경로, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENDER_KEY}`,
        'Origin': ALLOWED_ORIGIN
      }
    });
    if (!응답.ok) throw new Error('학습용.txt 파일을 읽지 못했습니다.');
    const 데이터 = await 응답.text();
    return 데이터;
  } catch (error) {
    console.error('학습용.txt 파일 읽기 중 오류:', error);
    return '';
  }
}

/***** 의도 인식 그룹 업데이트 *****/
function 의도_인식_그룹_업데이트(텍스트) {
  const intent = 텍스트에서_의도_감지(텍스트);
  if (!의도_인식_그룹[intent]) 의도_인식_그룹[intent] = [];
  의도_인식_그룹[intent].push(텍스트);
  console.log(`의도: ${intent}, 텍스트: ${텍스트}`);
}

/***** 의도 감지 *****/
function 텍스트에서_의도_감지(입력) {
  for (const intent in 키워드) {
    if (키워드[intent].some(키워드 => 입력.includes(키워드))) return intent;
  }
  return '알수없음';
}

/***** 채팅 처리 *****/
async function 채팅_전송() {
  const 입력_요소 = document.getElementById("chat-input");
  if (!입력_요소 || !입력_요소.value.trim()) return;
  const 입력 = 입력_요소.value.trim();

  // 학습용.txt에 입력 추가 및 서버 업데이트
  await 학습_파일에_추가(입력);

  // 의도 인식 그룹 업데이트
  의도_인식_그룹_업데이트(입력);

  // 학습용.txt 데이터를 읽어와 벡터화 및 정제 후 말풍선에 표시
  const 학습_데이터_텍스트 = await 학습_파일_읽기();
  const 학습_데이터_라인 = 학습_데이터_텍스트.split('\n').filter(line => line);
  if (학습_데이터_라인.length > 0) {
    const 최신_라인 = 학습_데이터_라인[학습_데이터_라인.length - 1];
    const [타임스탬프, 인코딩] = 최신_라인.split(':');
    const 디코딩_텍스트 = decodeURIComponent(escape(atob(인코딩)));
    const 정제_텍스트 = 텍스트_정제(디코딩_텍스트);
    const 토큰 = 단어_토큰화(정제_텍스트);
    const 벡터 = 텍스트_벡터화(정제_텍스트);
    const 단어_출력 = 토큰.join(' '); // 단어 단위로 출력
    말풍선_표시(단어_출력); // 말풍선에 단어 표시
  }

  // 자동 학습 트리거
  const 학습_데이터 = 학습_데이터_생성();
  if (학습_데이터.length > 0) {
    에포크_학습(학습_데이터, 1); // 1 에포크 학습
  }

  입력_요소.value = "";
}

/***** 말풍선 표시 *****/
function 말풍선_표시(텍스트, 청크_크기 = 15) {
  const 풍선 = document.getElementById("speech-bubble");
  if (!풍선) return;
  풍선.style.opacity = 0;
  풍선.style.display = "block";
  let 부분 = [];
  for (let i = 0; i < 텍스트.length; i += 청크_크기) 부분.push(텍스트.slice(i, i + 청크_크기));
  let 인덱스 = 0;
  풍선.textContent = "";

  function 다음_부분_표시() {
    if (인덱스 === 0) 풍선.style.opacity = 1;
    if (인덱스 < 부분.length) {
      풍선.textContent += 부분[인덱스];
      인덱스++;
      requestAnimationFrame(다음_부분_표시);
    } else {
      setTimeout(() => { 풍선.style.opacity = 0; 풍선.style.display = "none"; }, 2000);
    }
  }
  requestAnimationFrame(다음_부분_표시);
}

/***** 지역 변경 함수 *****/
function 지역_변경(지역) {
  const 지역_선택 = document.getElementById("region-select");
  if (지역_선택) {
    지역_선택.value = 지역;
    console.log(`지역이 ${지역}으로 변경되었습니다.`);
  }
}

/***** 지역 드롭다운 채우기 *****/
function 지역_드롭다운_채우기() {
  const 지역_선택 = document.getElementById("region-select");
  if (!지역_선택) {
    console.error("ID가 'region-select'인 요소를 찾을 수 없습니다.");
    return;
  }
  지역_선택.innerHTML = "";
  키워드.지역.forEach(지역 => {
    const 옵션 = document.createElement("option");
    옵션.value = 지역;
    옵션.textContent = 지역;
    지역_선택.appendChild(옵션);
  });
}

/***** DOM 이벤트 처리 및 모델 초기화 *****/
window.addEventListener("DOMContentLoaded", async () => {
  지역_드롭다운_채우기();
  const 채팅_입력 = document.getElementById("chat-input");
  if (채팅_입력) {
    채팅_입력.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") await 채팅_전송();
    });
  }

  loadModel(); // 저장된 MLP 모델 로드

  // 학습용.txt 파일에서 데이터 로드 및 의도_인식_그룹 초기화
  const 학습_데이터_텍스트 = await 학습_파일_읽기();
  const 학습_데이터_라인 = 학습_데이터_텍스트.split('\n');
  학습_데이터_라인.forEach(라인 => {
    if (라인) {
      const [타임스탬프, 인코딩] = 라인.split(':');
      const 텍스트 = decodeURIComponent(escape(atob(인코딩)));
      의도_인식_그룹_업데이트(텍스트);
    }
  });
});
