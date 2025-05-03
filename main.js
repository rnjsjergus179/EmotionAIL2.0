// API 키는 localStorage에서 가져옴 (보안 강화를 위해 프로덕션에서는 다른 방법 사용 권장)
const API_KEY = localStorage.getItem('API_KEY');
const SERVER_API_URL = 'https://emotionail2-0.onrender.com//api'; // 실제 서버 API URL로 교체 필요

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

/***** 유틸리티 함수 *****/
function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
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

  // 입력을 학습용.txt에 저장
  await appendToLearningFile(input);

  // 학습용.txt 파일에서 데이터 가져오기
  const learningData = await readLearningFile();
  const lines = learningData.trim().split('\n');
  const decodedLines = lines.map(line => {
    const parts = line.split(':');
    if (parts.length === 2) {
      return decodeURIComponent(escape(atob(parts[1]))); // base64 디코딩하여 한글로 변환
    }
    return line;
  });
  const cleanedText = recombineKorean(tokenizeAndFilter(decodedLines.join(' ')));
  updateIntentRecognitionGroup(cleanedText);

  let response = "";
  let isHTML = false;
  let shouldNavigate = false;
  let navigateUrl = "";

  // 지역 키워드 확인
  const matchedRegion = KEYWORDS.region.find(region => input.includes(region));
  if (matchedRegion) {
    changeRegion(matchedRegion);
    response = `지역을 ${matchedRegion}으로 변경했습니다.`;
  } else {
    // 사이트 링크 확인
    for (let site in SITE_LINKS) {
      if (input.includes(site)) {
        if (site === "유튜브") {
          const query = input.replace(/유튜브|youtube|동영상|비디오|영상/gi, "").trim();
          response = query ? await getYouTubeSearchResults(query) : "유튜브 검색어를 입력해주세요.";
          isHTML = !!query;
        } else if (site === "네이버") {
          const query = input.replace(/네이버|naver|검색|찾기/gi, "").trim();
          response = query ? await getNaverSearchResults(query) : "검색어를 입력해주세요.";
        } else {
          response = `${site} 사이트로 이동합니다!`;
          shouldNavigate = true;
          navigateUrl = SITE_LINKS[site];
        }
        break;
      }
    }

    // 의도 처리
    if (!response) {
      const intent = detectIntentFromText(input);
      if (intent === "greetings") response = "안녕하세요!";
      else if (intent === "sleep") response = "좋은 꿈 꾸세요!";
      else if (intent === "time") {
        const now = new Date();
        response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
      } else {
        response = cleanedText; // 디코딩된 텍스트 표시
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

/***** DOM 이벤트 처리 *****/
window.addEventListener("DOMContentLoaded", () => {
  populateRegionDropdown();
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat();
    });
  }
});
