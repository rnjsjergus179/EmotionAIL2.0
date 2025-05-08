// API 키와 서버 URL 설정 (현재 저장에 사용되지 않음, 유지됨)
const API_키 = localStorage.getItem('API_키');
const 서버_API_URL = 'https://emotionail2-0.onrender.com/api'; // 실제 서버 URL로 교체 필요

/***** 사이트 링크와 키워드 정의 *****/
const 사이트_링크 = {
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

let 키워드 = {
  인사: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네", "반가워"],
  취침: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
  날씨: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
  시간: ["시간 알려줘"],
  일정: ["일정 알려줘", "오늘 일정", "이번 주 일정", "일정 확인", "일정 보여줘"],
  지역: ["서울", "인천", "수원", "고양", "성남", "용인", "부천", "안양", "의정부", "광명", "안산", "파주", "부산", "대구", "광주", "대전", "울산", "제주", "전주", "청주", "포항", "여수", "김해"]
};

let 의도_인식_그룹 = {};
let 적응형_학습률 = 0.01;

// 단어 임베딩을 위한 간단한 사전 (예시)
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

// 텍스트를 벡터화 (단어 임베딩을 사용한 간단한 벡터화)
function 텍스트_벡터화(텍스트) {
  const 토큰 = 단어_토큰화(텍스트);
  const 벡터 = Array(300).fill(0);
  토큰.forEach(단어 => {
    const 인덱스 = 단어_임베딩(단어) % 300;
    벡터[인덱스] += 1;
  });
  return new Float32Array(벡터);
}

/***** 학습용 데이터와 모델 정의 *****/
const 입력_크기 = 300; // 300차원 벡터로 설정
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

// 학습 루프 (서버 전송 제거)
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

/***** 유틸리티 함수 *****/
function 내적(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function 벡터_평균(벡터들) {
  if (벡터들.length === 0) return Array(300).fill(0);
  const 합 = 벡터들.reduce((acc, vec) => acc.map((val, i) => val + vec[i]), Array(벡터들[0].length).fill(0));
  return 합.map(val => val / 벡터들.length);
}

/***** 학습용.txt 관리 (localStorage 사용) *****/
function 학습_파일에_추가(입력) {
  const 타임스탬프 = Date.now();
  const 인코딩 = `${타임스탬프}:${btoa(unescape(encodeURIComponent(입력)))}\n`;
  let 현재_데이터 = localStorage.getItem('학습용_데이터') || '';
  현재_데이터 += 인코딩;
  localStorage.setItem('학습용_데이터', 현재_데이터);
  console.log('데이터가 학습용.txt에 추가되었습니다.');
}

function 학습_파일_읽기() {
  return localStorage.getItem('학습용_데이터') || '';
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
function 채팅_전송() {
  const 입력_요소 = document.getElementById("chat-input");
  if (!입력_요소 || !입력_요소.value.trim()) return;
  const 입력 = 입력_요소.value.trim();

  // 학습용.txt에 입력 추가
  학습_파일에_추가(입력);

  // 의도 인식 그룹 업데이트
  의도_인식_그룹_업데이트(입력);

  // 자동 학습 트리거
  const 학습_데이터 = 학습_데이터_생성();
  if (학습_데이터.length > 0) {
    에포크_학습(학습_데이터, 1); // 1 에포크 학습
  }

  // 말풍선에 입력 표시
  말풍선_표시(입력);

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
window.addEventListener("DOMContentLoaded", () => {
  지역_드롭다운_채우기();
  const 채팅_입력 = document.getElementById("chat-input");
  if (채팅_입력) {
    채팅_입력.addEventListener("keydown", (e) => {
      if (e.key === "Enter") 채팅_전송();
    });
  }

  loadModel(); // 저장된 MLP 모델 로드

  // 학습용.txt 파일에서 데이터 로드 및 의도_인식_그룹 초기화
  const 학습_데이터_텍스트 = 학습_파일_읽기();
  const 학습_데이터_라인 = 학습_데이터_텍스트.split('\n');
  학습_데이터_라인.forEach(라인 => {
    if (라인) {
      const [타임스탬프, 인코딩] = 라인.split(':');
      const 텍스트 = decodeURIComponent(escape(atob(인코딩)));
      의도_인식_그룹_업데이트(텍스트);
    }
  });
});
