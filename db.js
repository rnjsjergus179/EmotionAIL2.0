// db.js
require('dotenv').config();
const mongoose = require('mongoose');

// 1) MongoDB 연결
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
    console.error(`❌ MongoDB 연결 실패: ${error.stack}`);
    process.exit(1);
  }
}

// 2) SearchLog 스키마
const SearchLogSchema = new mongoose.Schema({
  source:    { type: String, enum: ['youtube','naver'], required: true },
  query:     { type: String, required: true },
  tokens:    [String],
  intent:    { type: String },
  results:   [[String]],
  createdAt: { type: Date, default: Date.now }
});
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);

// 3) 자모 테이블
const CHOSEONG  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSEONG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSEONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

// 4) 자모 토큰화 함수
function tokenizeQuery(text) {
  const tokens = [];
  for (let ch of text) {
    const code = ch.charCodeAt(0);
    if (44032 <= code && code <= 55203) {
      const uni   = code - 44032;
      const cho   = Math.floor(uni / (21 * 28));
      const jung  = Math.floor((uni % (21 * 28)) / 28);
      const jong  = uni % 28;
      tokens.push(CHOSEONG[cho], JUNGSEONG[jung]);
      if (jong > 0) tokens.push(JONGSEONG[jong]);
    } else {
      tokens.push(ch);
    }
  }
  return tokens;
}

// 5) 의도 인식 함수
function recognizeIntent(text) {
  if (['날씨','기온','비','눈'].some(k => text.includes(k))) return 'weather';
  if (['뉴스','기사','이슈'].some(k => text.includes(k))) return 'news';
  return 'general';
}

// 6) 객체에서 문자열만 추출하는 함수
function extractLines(obj) {
  const lines = [];
  function recurse(v) {
    if (Array.isArray(v)) {
      v.forEach(recurse);
    } else if (v && typeof v === 'object') {
      Object.values(v).forEach(recurse);
    } else if (typeof v === 'string') {
      v.trim().split('\n').forEach(l => {
        if (l) lines.push(l.trim());
      });
    }
  }
  recurse(obj);
  return lines;
}

// 7) 저장 크기 제한 설정
const MAX_LINES = 200;
const MAX_LINE_LENGTH = 1000;

// 8) 검색 기록 저장 함수
async function saveSearchData(source, query, resultsData) {
  console.log(`[saveSearchData] source=${source}, query=${query}`);

  // a) 텍스트 라인 추출
  let textLines;
  if (typeof resultsData === 'string') {
    textLines = resultsData.split('\n');
  } else {
    textLines = extractLines(resultsData);
  }
  console.log(`[saveSearchData] 추출된 라인 수: ${textLines.length}`);

  // b) 최대 라인 수 제한
  if (textLines.length > MAX_LINES) {
    console.warn(`[saveSearchData] 라인 수(${textLines.length}) > MAX_LINES(${MAX_LINES}), 자릅니다.`);
    textLines = textLines.slice(0, MAX_LINES);
  }

  // c) 줄당 최대 길이 제한
  textLines = textLines.map(line =>
    line.length > MAX_LINE_LENGTH ? line.slice(0, MAX_LINE_LENGTH) : line
  );

  console.log(`[saveSearchData] 최종 라인 수: ${textLines.length}`);

  // d) 자모 토큰화
  const tokenizedResults = textLines.map(line => tokenizeQuery(line));

  // e) 검색어 자모 토큰화 + 의도 인식
  const tokens = tokenizeQuery(query);
  const intent = recognizeIntent(query);

  // f) MongoDB 저장
  const doc = new SearchLog({
    source,
    query,
    tokens,
    intent,
    results: tokenizedResults
  });
  const saved = await doc.save();
  console.log(`[saveSearchData] 저장 완료 _id=${saved._id}`);
}

// 9) 전체 검색 기록 가져오기
async function getAllSearchData() {
  return await SearchLog.find().sort({ createdAt: -1 }).limit(100);
}

// 10) 모듈 export
module.exports = {
  connectDB,
  saveSearchData,
  getAllSearchData
};
