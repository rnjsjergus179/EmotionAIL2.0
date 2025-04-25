// backend/db.js
require('dotenv').config();
const mongoose = require('mongoose');
const Mecab = require('mecab-ffi'); // node-korean-tokenizer 대체용
const mecab = new Mecab(); // MeCab 인스턴스 생성

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
  source: {
    type: String,
    enum: ['google', 'youtube', 'naver'],
    required: true
  },
  query:    { type: String, required: true },       // 원본 검색 쿼리
  tokens:   [String],                               // 토큰화된 결과
  intent:   { type: String },                       // 의도 인식 결과
  results:  mongoose.Schema.Types.Mixed,            // API 응답 데이터
  createdAt: { type: Date, default: Date.now }      // 생성 시간
});

// 3) InteractionLog 스키마 정의
const InteractionSchema = new mongoose.Schema({
  userInput:    { type: String, required: true },   // 사용자 입력
  botResponse:  { type: String, required: true },   // 봇 응답
  emotionCounts: {
    positive: { type: Number, default: 0 },         // 긍정 감정
    negative: { type: Number, default: 0 },         // 부정 감정
    surprise: { type: Number, default: 0 }          // 놀람 감정
  },
  timestamp:    { type: Date, default: Date.now }   // 타임스탬프
});

// 4) 모델 생성
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);
const InteractionLog = mongoose.model('InteractionLog', InteractionSchema);

// 5) 한국어 토큰화 함수
function tokenizeQuery(query) {
  return mecab.parseSync(query).map(token => token[0]); // MeCab을 사용해 형태소 단위로 토큰화
}

// 6) 의도 인식 함수 (규칙 기반)
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

// 7) 감정 분석 및 반복 학습 함수
async function updateEmotionCounts() {
  try {
    const logs = await InteractionLog.find({});
    for (const log of logs) {
      const positiveWords = ['좋다', '기쁘다', '행복'];
      const negativeWords = ['나쁘다', '슬프다', '화나다'];
      const surpriseWords = ['놀라다', '신기하다'];

      let positive = 0, negative = 0, surprise = 0;
      positiveWords.forEach(word => {
        if (log.userInput.includes(word)) positive++;
      });
      negativeWords.forEach(word => {
        if (log.userInput.includes(word)) negative++;
      });
      surpriseWords.forEach(word => {
        if (log.userInput.includes(word)) surprise++;
      });

      log.emotionCounts = { positive, negative, surprise };
      await log.save();
    }
    console.log('✅ 감정 카운트 업데이트 완료');
  } catch (error) {
    console.error(`❌ 감정 카운트 업데이트 실패: ${error.message}`);
  }
}

// 8) 데이터 저장 함수 (server.js에서 호출용)
async function saveSearchData(source, query, results) {
  try {
    // 쿼리를 토큰화
    const tokens = tokenizeQuery(query);
    // 의도 인식
    const intent = recognizeIntent(query);

    // MongoDB에 저장
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
  InteractionLog,
  saveSearchData,
  updateEmotionCounts // 반복 학습용 함수 내보내기
};
