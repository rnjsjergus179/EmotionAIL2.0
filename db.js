require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// 1) MongoDB 연결 함수 (앱 시작 시 한 번만 호출하세요)
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI가 정의되지 않았습니다. .env 파일을 확인하세요.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB에 연결되었습니다.');
  } catch (error) {
    console.error(`❌ MongoDB 연결 실패: ${error.message}`);
    process.exit(1);
  }
}

// 2) SearchLog 스키마 정의
const SearchLogSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['youtube', 'naver'],   // 'google' 제거
    required: true
  },
  query: { type: String, required: true },      // 원본 검색어
  tokens: [String],                             // 토큰화된 결과
  intent: { type: String },                     // 의도 인식 결과
  results: mongoose.Schema.Types.Mixed,         // API 응답 데이터 (텍스트로 저장)
  createdAt: { type: Date, default: Date.now }  // 저장 시간
});

const SearchLog = mongoose.model('SearchLog', SearchLogSchema);

// 3) 한글 자모 분리용 테이블
const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSEONG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSEONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 4) 자모 토큰화 함수
function tokenizeQuery(query) {
  const tokens = [];
  for (let char of query) {
    const code = char.charCodeAt(0);
    if (44032 <= code && code <= 55203) { // 한글 범위
      const uni = code - 44032;
      const choIdx = Math.floor(uni / (21 * 28));
      const jungIdx = Math.floor((uni % (21 * 28)) / 28);
      const jongIdx = uni % 28;
      tokens.push(CHOSEONG[choIdx], JUNGSEONG[jungIdx]);
      if (jongIdx > 0) tokens.push(JONGSEONG[jongIdx]);
    } else {
      tokens.push(char);
    }
  }
  return tokens;
}

// 5) 토큰을 다시 합치는 함수 (검증용)
function combineTokens(tokens) {
  let out = '', i = 0;
  while (i < tokens.length) {
    const choIdx = CHOSEONG.indexOf(tokens[i]);
    const jungIdx = JUNGSEONG.indexOf(tokens[i + 1]);
    let jongIdx = 0;
    if (i + 2 < tokens.length) {
      const j = JONGSEONG.indexOf(tokens[i + 2]);
      if (j >= 0) jongIdx = j;
    }
    if (choIdx >= 0 && jungIdx >= 0) {
      const code = 44032 + (choIdx * 21 + jungIdx) * 28 + jongIdx;
      out += String.fromCharCode(code);
      i += jongIdx > 0 ? 3 : 2;
    } else {
      out += tokens[i++];
    }
  }
  return out;
}

// 6) 의도 인식 함수 (간단한 규칙 기반)
function recognizeIntent(q) {
  if (['날씨', '기온', '비', '눈'].some(k => q.includes(k))) return 'weather';
  if (['뉴스', '기사', '이슈'].some(k => q.includes(k))) return 'news';
  return 'general';
}

// 7) 검색 데이터 저장 함수 (server.js에서 호출)
async function saveSearchData(source, query, filePath) {
  try {
    // 파일에서 데이터 읽기 (텍스트로 읽기)
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const tokens = tokenizeQuery(query);             // 검색어를 토큰화
    const intent = recognizeIntent(combineTokens(tokens)); // 의도 인식
    console.log(`🔄 [${source}] "${query}" 저장 시도 중...`); // 저장 시도 로그 추가
    
    // DB에 저장 (results 필드에 텍스트 내용 저장)
    await SearchLog.create({ source, query, tokens, intent, results: fileContent });
    
    console.log(`✅ [${source}] "${query}" 저장 완료`); // 저장 성공 로그
  } catch (err) {
    console.error(`❌ [${source}] 저장 실패: ${err.message}`); // 저장 실패 로그
  }
}

// 모듈 내보내기
module.exports = {
  connectDB,
  saveSearchData
};
