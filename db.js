require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB 연결 함수
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI 환경 변수가 정의되지 않았습니다.');
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

// 스키마 정의
const SearchLogSchema = new mongoose.Schema({
  source: { type: String, enum: ['google', 'youtube', 'naver'], required: true },
  query: { type: String, required: true },
  tokens: [String],
  intent: { type: String },
  results: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const IntentKeywordsSchema = new mongoose.Schema({
  intent: { type: String, required: true },
  keywords: [String]
});

// 모델 생성
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);
const IntentKeywords = mongoose.model('IntentKeywords', IntentKeywordsSchema);

// 자모음 정의
const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSEONG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSEONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 쿼리 토큰화 함수
function tokenizeQuery(query) {
  const tokens = [];
  for (let char of query) {
    const code = char.charCodeAt(0);
    if (code >= 44032 && code <= 55203) {
      const uni = code - 44032;
      const choIdx = Math.floor(uni / (21 * 28));
      const jungIdx = Math.floor((uni % (21 * 28)) / 28);
      const jongIdx = uni % 28;

      tokens.push(CHOSEONG[choIdx]);
      tokens.push(JUNGSEONG[jungIdx]);
      if (jongIdx > 0) tokens.push(JONGSEONG[jongIdx]);
    } else {
      tokens.push(char);
    }
  }
  return tokens.filter(token => token.length > 0);
}

// 자모음 조합 함수
function combineJamo(tokens) {
  const CHOSEONG_CODE = 44032;
  const JUNGSEONG_OFFSET = 28;
  let word = '';
  let cho, jung, jong = 0;

  for (let token of tokens) {
    if (CHOSEONG.includes(token)) {
      cho = CHOSEONG.indexOf(token);
    } else if (JUNGSEONG.includes(token)) {
      jung = JUNGSEONG.indexOf(token);
      const base = CHOSEONG_CODE + (cho * 21 + jung) * JUNGSEONG_OFFSET;
      word += String.fromCharCode(base + jong);
      jong = 0;
    } else if (JONGSEONG.includes(token)) {
      jong = JONGSEONG.indexOf(token);
    } else {
      word += token;
    }
  }
  return word;
}

// 의도 인식 함수
async function recognizeIntent(query) {
  try {
    const tokens = tokenizeQuery(query);
    const word = combineJamo(tokens);
    const intentDocs = await IntentKeywords.find({});
    for (const doc of intentDocs) {
      if (doc.keywords.some(keyword => word.includes(keyword))) {
        return doc.intent;
      }
    }
    return 'general';
  } catch (error) {
    console.error(`❌ 의도 인식 실패: ${error.message}`);
    return 'general';
  }
}

// 데이터 저장 함수
async function saveSearchData(source, query, results) {
  try {
    const tokens = tokenizeQuery(query);
    const intent = await recognizeIntent(query);

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

// 내보내기
module.exports = {
  connectDB,
  SearchLog,
  IntentKeywords,
  saveSearchData
};
