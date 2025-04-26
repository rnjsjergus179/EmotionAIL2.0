// backend/db.js
require('dotenv').config();
const mongoose = require('mongoose');

// 1) MongoDB 연결 함수
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI 환경 변수가 정의되지 않았습니다. .env 파일을 확인하세요.');
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
  source: { type: String, enum: ['google', 'youtube', 'naver'], required: true },
  query: { type: String, required: true },
  tokens: [String],
  intent: { type: String },
  results: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

// 3) 모델 생성
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);

// 4) 한글 자모 분리용 테이블
const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSEONG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSEONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 5) 자모음으로 토큰화
function tokenizeQuery(query) {
  const tokens = [];
  for (let char of query) {
    const code = char.charCodeAt(0);
    if (code >= 44032 && code <= 55203) { // 한글 완성형 범위
      const uni = code - 44032;
      const choIdx = Math.floor(uni / (21 * 28));
      const jungIdx = Math.floor((uni % (21 * 28)) / 28);
      const jongIdx = uni % 28;

      tokens.push(CHOSEONG[choIdx]);
      tokens.push(JUNGSEONG[jungIdx]);
      if (jongIdx > 0) tokens.push(JONGSEONG[jongIdx]);
    } else {
      tokens.push(char); // 영어, 숫자 등은 그대로
    }
  }
  return tokens;
}

// 6) 토큰화된 자모 조합해서 복원
function combineTokens(tokens) {
  let result = '';
  let i = 0;

  while (i < tokens.length) {
    const choIdx = CHOSEONG.indexOf(tokens[i]);
    const jungIdx = JUNGSEONG.indexOf(tokens[i + 1]);
    let jongIdx = 0;

    if (i + 2 < tokens.length) {
      jongIdx = JONGSEONG.indexOf(tokens[i + 2]);
      if (jongIdx < 0) jongIdx = 0;
    }

    if (choIdx >= 0 && jungIdx >= 0) {
      const code = 44032 + (choIdx * 21 + jungIdx) * 28 + jongIdx;
      result += String.fromCharCode(code);
      i += jongIdx > 0 ? 3 : 2;
    } else {
      result += tokens[i];
      i++;
    }
  }

  return result;
}

// 7) 의도 인식 함수 (심플 규칙)
function recognizeIntent(query) {
  const weatherKeywords = ['날씨', '기온', '비', '눈'];
  const newsKeywords = ['뉴스', '기사', '이슈'];

  if (weatherKeywords.some(keyword => query.includes(keyword))) {
    return 'weather';
  } else if (newsKeywords.some(keyword => query.includes(keyword))) {
    return 'news';
  } else {
    return 'general';
  }
}

// 8) 데이터 저장 함수 (server.js에서 호출)
async function saveSearchData(source, query, results) {
  try {
    const tokens = tokenizeQuery(query);  // 1. 쿼리 → 토큰화
    const combinedQuery = combineTokens(tokens); // 2. 토큰 → 다시 조합 (검증용)
    const intent = recognizeIntent(combinedQuery); // 3. 의도 인식

    await SearchLog.create({
      source,
      query,
      tokens,
      intent,
      results
    });
    console.log(`✅ 데이터 저장 완료: ${query}`);
  } catch (error) {
    console.error(`❌ 데이터 저장 실패: ${error.message}`);
  }
}

// 9) 내보내기
module.exports = {
  connectDB,
  SearchLog,
  saveSearchData
};
