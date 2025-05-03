// API 키와 서버 URL 설정
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
const API_기본_URL = 'https://emotionail2-0.onrender.com';
let 역사_임베딩 = [];
let 적응형_학습률 = 0.01;

const 지식_그래프 = {
  "넷플릭스": ["드라마", "영화"],
  "유튜브": ["영상", "비디오"],
  "날씨": ["날씨"],
  "일정": ["일정"],
  "지역": ["지역", "위치", "도시"]
};

const api_캐시 = {};

/***** 자모 정의 *****/
const 자모 = {
  초성: ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
  중성: ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'],
  종성: ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
};

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

// 학습용 데이터 생성 함수
function 학습_데이터_생성() {
  const 학습_데이터 = [];
  의도.forEach((intent, index) => {
    if (의도_인식_그룹[intent] && 의도_인식_그룹[intent].length > 0) {
      의도_인식_그룹[intent].forEach(binaryString => {
        const vector = binaryStringToVector(binaryString);
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

// 학습 루프 및 서버 전송
async function 에포크_학습(데이터, 에포크 = 10) {
  // 학습 전 모델 상태 저장
  const 모델_전 = {
    가중치1: JSON.parse(JSON.stringify(가중치1)),
    편향1: JSON.parse(JSON.stringify(편향1)),
    가중치2: JSON.parse(JSON.stringify(가중치2)),
    편향2: JSON.parse(JSON.stringify(편향2))
  };

  for (let epoch = 0; epoch < 에포크; epoch++) {
    데이터.forEach(샘플 => {
      학습(샘플.입력, 샘플.라벨, 0.01);
    });
    console.log(`에포크 ${epoch + 1}/${에포크} 완료`);
  }

  // 학습 후 모델 상태 저장
  const 모델_후 = {
    가중치1: 가중치1,
    편향1: 편향1,
    가중치2: 가중치2,
    편향2: 편향2
  };

  // 서버로 전후 모델 전송
  await 모델_서버에_전송(모델_전, 모델_후);
}

// 모델을 서버로 전송하는 함수
async function 모델_서버에_전송(모델_전, 모델_후) {
  const 데이터 = { 모델_전, 모델_후 };
  try {
    const 응답 = await fetch(`${서버_API_URL}/save-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_키': API_키
      },
      body: JSON.stringify(데이터)
    });
    if (!응답.ok) throw new Error('모델 전송 실패');
    console.log('모델이 서버에 전송되었습니다.');
  } catch (error) {
    console.error('모델 전송 중 오류:', error);
  }
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

// 모델 로드 (로컬)
function 모델_로드() {
  const 저장된_모델 = localStorage.getItem('mlp모델');
  if (저장된_모델) {
    const 모델 = JSON.parse(저장된_모델);
    가중치1 = 모델.가중치1;
    편향1 = 모델.편향1;
    가중치2 = 모델.가중치2;
    편향2 = 모델.편향2;
    console.log("모델이 로드되었습니다.");
  } else {
    console.log("저장된 모델이 없습니다.");
  }
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

/***** 한국어 토큰화 및 이진수 변환 *****/
function 토큰화_및_필터링(텍스트) {
  const 한글_범위 = /[\uAC00-\uD7AF]/g;
  let 토큰 = [];
  텍스트.split(' ').forEach(단어 => {
    if (/[a-zA-Z]/.test(단어)) {
      // 영어 단어는 필터링 (무시)
    } else if (한글_범위.test(단어)) {
      for (let char of 단어) {
        const 코드 = char.charCodeAt(0) - 0xAC00;
        if (코드 >= 0 && 코드 <= 11171) {
          const 초성 = Math.floor(코드 / (21 * 28));
          const 중성 = Math.floor((코드 % (21 * 28)) / 28);
          const 종성 = 코드 % 28;
          토큰.push({ 유형: '초성', 값: 자모.초성[초성] });
          토큰.push({ 유형: '중성', 값: 자모.중성[중성] });
          if (종성 > 0) 토큰.push({ 유형: '종성', 값: 자모.종성[종성] });
        }
      }
    }
  });
  return 토큰;
}

// 이진 문자열 생성 함수
function generateBinaryString(tokens) {
  return tokens.map(token => {
    let prefix;
    switch (token.유형) {
      case '초성':
        prefix = 0; // 초성은 0
        break;
      case '중성':
        prefix = 1; // 중성은 1
        break;
      case '종성':
        prefix = 2; // 종성은 2
        break;
      default:
        prefix = -1; // 오류 방지
    }
    return `${prefix}.${token.값}`;
  }).join('');
}

// 이진 문자열을 300차원 벡터로 변환
function binaryStringToVector(binaryString) {
  const vector = Array(300).fill(0);
  const parts = binaryString.split('.');
  for (let i = 0; i < parts.length; i += 2) {
    const index = parseInt(parts[i], 10) * 100 + (parts[i + 1] ? parts[i + 1].charCodeAt(0) % 100 : 0);
    vector[index % 300] = 1; // 해시 기반 벡터화
  }
  return new Float32Array(vector);
}

function 한국어_재결합(토큰) {
  let 결과 = '';
  let 버퍼 = [];
  for (let token of 토큰) {
    버퍼.push(token);
  }
  if (버퍼.length) 결과 += 버퍼_재결합(버퍼);
  return 결과.trim();
}

function 버퍼_재결합(버퍼) {
  let 단어 = '';
  let i = 0;
  while (i < 버퍼.length) {
    if (버퍼[i].유형 === '초성' && i + 1 < 버퍼.length && 버퍼[i + 1].유형 === '중성') {
      const 초성_인덱스 = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.indexOf(버퍼[i].값) / 2;
      const 중성_인덱스 = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.indexOf(버퍼[i + 1].값) / 2;
      let 종성_인덱스 = 0;
      if (i + 2 < 버퍼.length && 버퍼[i + 2].유형 === '종성') {
        종성_인덱스 = 'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.indexOf(버퍼[i + 2].값) / 2 + 1;
        i += 3;
      } else {
        i += 2;
      }
      const 문자_코드 = 0xAC00 + (초성_인덱스 * 21 * 28) + (중성_인덱스 * 28) + 종성_인덱스;
      단어 += String.fromCharCode(문자_코드);
    } else {
      i++;
    }
  }
  return 단어;
}

/***** 서버와의 통신을 통한 학습용.txt 관리 *****/
async function 학습_파일에_추가(입력) {
  const 타임스탬프 = Date.now();
  const 인코딩 = `${타임스탬프}:${btoa(unescape(encodeURIComponent(입력)))}\n`;
  try {
    const 응답 = await fetch(`${서버_API_URL}/append-to-learning-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_키': API_키
      },
      body: JSON.stringify({ data: 인코딩 })
    });
    if (!응답.ok) throw new Error('학습용.txt 파일에 추가 실패');
    console.log('데이터가 학습용.txt에 추가되었습니다.');
  } catch (error) {
    console.error('학습용.txt 파일 추가 중 오류:', error);
    const 현재_데이터 = await 학습_파일_읽기();
    localStorage.setItem('학습_데이터', 현재_데이터 + 인코딩);
  }
}

async function 학습_파일_읽기() {
  try {
    const 응답 = await fetch(`${서버_API_URL}/read-learning-file`, {
      method: 'GET',
      headers: { 'API_키': API_키 }
    });
    if (!응답.ok) throw new Error('학습용.txt 파일을 불러오지 못했습니다.');
    const 데이터 = await 응답.text();
    return 데이터;
  } catch (error) {
    console.error('학습용.txt 파일 불러오기 중 오류:', error);
    return localStorage.getItem('학습_데이터') || '';
  }
}

/***** 텍스트 벡터화 및 의도 인식 그룹 업데이트 *****/
function 텍스트_벡터화(텍스트) {
  const 토큰 = 토큰화_및_필터링(텍스트);
  const binaryString = generateBinaryString(토큰);
  return binaryStringToVector(binaryString);
}

function 벡터_양자화(벡터) {
  return 벡터.map(val => Math.round(val * 100) / 100);
}

function 의도_인식_그룹_업데이트(텍스트) {
  const 토큰 = 토큰화_및_필터링(텍스트);
  const binaryString = generateBinaryString(토큰);
  const intent = 텍스트에서_의도_감지(텍스트);
  if (!의도_인식_그룹[intent]) 의도_인식_그룹[intent] = [];
  의도_인식_그룹[intent].push(binaryString);
  console.log(`의도: ${intent}, 이진수 표현: ${binaryString}`);
}

/***** 의도 감지 *****/
function 텍스트에서_의도_감지(입력) {
  for (const intent in 키워드) {
    if (키워드[intent].some(키워드 => 입력.includes(키워드))) return intent;
  }
  return '알수없음';
}

/***** API 호출 함수 *****/
async function 키와_함께_가져오기(url, 옵션 = {}) {
  const 헤더 = { 'Content-Type': 'application/json', 'API_키': API_키, ...옵션.headers };
  return fetch(url, { ...옵션, headers: 헤더 });
}

async function 네이버_검색_결과_가져오기(쿼리) {
  const 캐시_키 = `네이버_${쿼리}`;
  if (api_캐시[캐시_키]) return api_캐시[캐시_키];
  try {
    const 응답 = await 키와_함께_가져오기(`${API_기본_URL}/api/naver-search?q=${encodeURIComponent(쿼리)}`);
    const 데이터 = await 응답.json();
    if (데이터.items && 데이터.items.length > 0) {
      const 결과 = 데이터.items.map(item => item.title.replace(/<[^>]+>/g, '')).join('\n- ');
      api_캐시[캐시_키] = 결과;
      await 학습_파일에_추가(`네이버:${쿼리}:${결과}`);
      return 결과;
    }
    return "검색 결과가 없습니다.";
  } catch (error) {
    console.error("네이버 검색 실패:", error);
    return "검색 결과를 가져오는데 실패했습니다.";
  }
}

async function 유튜브_검색_결과_가져오기(쿼리) {
  const 캐시_키 = `유튜브_${쿼리}`;
  if (api_캐시[캐시_키]) return api_캐시[캐시_키];
  try {
    const 응답 = await 키와_함께_가져오기(`${API_기본_URL}/api/youtube-search?q=${encodeURIComponent(쿼리)}`);
    const 데이터 = await 응답.json();
    if (데이터.items && 데이터.items.length > 0) {
      const 결과 = 데이터.items.map(item => `유튜브 링크: ${item.title} (새 탭에서 열림)`).join('<br>');
      api_캐시[캐시_키] = 결과;
      await 학습_파일에_추가(`유튜브:${쿼리}:${결과}`);
      return 결과;
    }
    return "검색 결과가 없습니다.";
  } catch (error) {
    console.error("유튜브 검색 실패:", error);
    return "유튜브 검색 결과를 가져오는데 실패했습니다.";
  }
}

/***** 채팅 처리 *****/
async function 채팅_전송() {
  const 입력_요소 = document.getElementById("chat-input");
  if (!입력_요소 || !입력_요소.value.trim()) return;
  const 입력 = 입력_요소.value.trim();

  await 학습_파일에_추가(입력);
  const 토큰 = 토큰화_및_필터링(입력);
  const binaryString = generateBinaryString(토큰);
  const vector = binaryStringToVector(binaryString);
  의도_인식_그룹_업데이트(입력);

  // 벡터를 문자열로 변환하여 표시 준비
  const vectorString = vector.join(', ');

  let 응답 = "";
  let HTML_여부 = false;
  let 이동_여부 = false;
  let 이동_URL = "";

  const 일치_지역 = 키워드.지역.find(지역 => 입력.includes(지역));
  if (일치_지역) {
    지역_변경(일치_지역);
    응답 = `지역을 ${일치_지역}으로 변경했습니다.\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
  } else {
    for (let 사이트 in 사이트_링크) {
      if (입력.includes(사이트)) {
        if (사이트 === "유튜브") {
          const 쿼리 = 입력.replace(/유튜브|youtube|동영상|비디오|영상/gi, "").trim();
          const 검색_결과 = 쿼리 ? await 유튜브_검색_결과_가져오기(쿼리) : "유튜브 검색어를 입력해주세요.";
          응답 = `${검색_결과}\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
          HTML_여부 = !!쿼리;
        } else if (사이트 === "네이버") {
          const 쿼리 = 입력.replace(/네이버|naver|검색|찾기/gi, "").trim();
          const 검색_결과 = 쿼리 ? await 네이버_검색_결과_가져오기(쿼리) : "검색어를 입력해주세요.";
          응답 = `${검색_결과}\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
        } else {
          응답 = `${사이트} 사이트로 이동합니다!\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
          이동_여부 = true;
          이동_URL = 사이트_링크[사이트];
        }
        break;
      }
    }

    if (!응답) {
      const intent = 텍스트에서_의도_감지(입력);
      if (intent === "인사") {
        응답 = `안녕하세요!\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
      } else if (intent === "취침") {
        응답 = `좋은 꿈 꾸세요!\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
      } else if (intent === "시간") {
        const 현재 = new Date();
        응답 = `현재 시간은 ${현재.getHours()}시 ${현재.getMinutes()}분입니다.\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
      } else {
        응답 = `입력: ${입력}\n이진 문자열: ${binaryString}\n300차원 벡터: ${vectorString}`;
      }
    }
  }

  // MLP 모델 학습
  const 학습_데이터 = 학습_데이터_생성();
  await 에포크_학습(학습_데이터, 10);

  말풍선_표시(응답, HTML_여부);
  if (이동_여부) setTimeout(() => { window.location.href = 이동_URL; }, 2000);
  입력_요소.value = "";
}

/***** 지역 변경 함수 *****/
function 지역_변경(지역) {
  const 지역_선택 = document.getElementById("region-select");
  if (지역_선택) {
    지역_선택.value = 지역;
    console.log(`지역이 ${지역}으로 변경되었습니다.`);
  }
}

/***** 말풍선 표시 *****/
function 말풍선_표시(텍스트, HTML_여부 = false, 청크_크기 = 15) {
  const 풍선 = document.getElementById("speech-bubble");
  if (!풍선) return;
  풍선.style.opacity = 0;
  풍선.style.display = "block";
  let 부분 = HTML_여부 ? 텍스트.split("<br>") : [];
  if (!HTML_여부) {
    for (let i = 0; i < 텍스트.length; i += 청크_크기) 부분.push(텍스트.slice(i, i + 청크_크기));
  }
  let 인덱스 = 0;
  풍선.innerHTML = "";

  function 다음_부분_표시() {
    if (인덱스 === 0) 풍선.style.opacity = 1;
    if (인덱스 < 부분.length) {
      if (HTML_여부) 풍선.innerHTML += 부분[인덱스] + "<br>";
      else 풍선.textContent += 부분[인덱스];
      인덱스++;
      requestAnimationFrame(다음_부분_표시);
    } else {
      setTimeout(() => { 풍선.style.opacity = 0; 풍선.style.display = "none"; }, 2000);
    }
  }
  requestAnimationFrame(다음_부분_표시);
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

  모델_로드();

  const 학습_버튼 = document.getElementById("train-button");
  if (학습_버튼) {
    학습_버튼.addEventListener("click", async () => {
      const 학습_데이터 = 학습_데이터_생성();
      await 에포크_학습(학습_데이터, 10);
      모델_저장();
    });
  }
});
