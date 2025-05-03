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
      { 입력: new Float32Array(Array(입력_크기).fill(0).map(() => Math.random())), 라벨: [1, 0, 0, 0,
