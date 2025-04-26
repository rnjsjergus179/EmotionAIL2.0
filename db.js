// db.js
require('dotenv').config();
const mongoose = require('mongoose');

// 1) MongoDB 연결 함수 (앱 시작 시 한 번만 호출)
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
    enum: ['youtube', 'naver'],  // 필요시 enum에 추가
    required: true
  },
  query: { type: String, required: true },
  tokens: [String],              // 검색어 자모 토큰
  intent: { type: String },      // 의도
  results: [ [String] ],         // 줄 단위 자모 토큰. 2차원 배열로 명시
  createdAt: { type: Date, default: Date.now }
});
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);

// 3) 한글 자모 분리용 테이블
const CHOSEONG  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSEONG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSEONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

// 4) 자모 토큰화 함수
function tokenizeQuery(query) {
  const tokens = [];
  for (let ch of query) {
    const code = ch.charCodeAt(0);
    if (44032 <= code && code <= 55203) {
      const uni = code - 44032;
      const cho = Math.floor(uni / (21 * 28));
      const jung = Math.floor((uni % (21 * 28)) / 28);
      const jong = uni % 28;
      tokens.push(CHOSEONG[cho], JUNGSEONG[jung]);
      if (jong > 0) tokens.push(JONGSEONG[jong]);
    } else {
      tokens.push(ch);
    }
  }
  return tokens;
}

// 5) 의도 인식 (간단 규칙)
function recognizeIntent(text) {
  if (['날씨','기온','비','눈'].some(k => text.includes(k))) return 'weather';
  if (['뉴스','기사','이슈'].some(k => text.includes(k))) return 'news';
  return 'general';
}

// 6) 검색 결과 저장 함수 (server.js에서 호출)
async function saveSearchData(source, query, resultsData) {
  try {
    // 6-1) 검색어 토큰화 & 의도 인식
    const queryTokens = tokenizeQuery(query);
    const reconstructed = queryTokens.join('');           // 자모 결합 없이 원문 그대로 비교해도 무방
    const intent = recognizeIntent(reconstructed);

    // 6-2) API 응답 객체를 문자열로 변환 (들여쓰기 포함)
    const textified = JSON.stringify(resultsData, null, 2);

    // 6-3) 줄 단위 분리 → 각 줄 자모 토큰화
    const lines = textified.split('\n');
    const tokenizedResults = lines.map(line => tokenizeQuery(line));

    console.log(`🔄 [${source}] "${query}" 저장 시도...`);

    // 6-4) DB에 저장
    await SearchLog.create({
      source,
      query,
      tokens: queryTokens,
      intent,
      results: tokenizedResults
    });

    console.log(`✅ [${source}] "${query}" 저장 완료.`);
  } catch (err) {
    console.error(`❌ [${source}] 저장 실패: ${err.message}`);
  }
}

module.exports = {
  connectDB,
  saveSearchData
};
