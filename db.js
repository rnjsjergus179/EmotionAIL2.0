// backend/db.js
require('dotenv').config();
const mongoose = require('mongoose');

// 1) MongoDB 연결 함수
async function connectDB() {
  // MONGO_URI가 정의되지 않은 경우 경고
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
    enum: ['google', 'youtube', 'naver'], // 새로운 소스 추가 시 여기에 정의 (예: 'bing')
    required: true
  },
  query:    { type: String, required: true },
  tokens:   [String],                        // NLP 토큰화 결과 (server.js에서 처리 필요)
  results:  mongoose.Schema.Types.Mixed,     // API 응답 데이터 (구조화되지 않은 JSON 허용)
  createdAt: { type: Date, default: Date.now }
});

// 3) InteractionLog 스키마 정의
const InteractionSchema = new mongoose.Schema({
  userInput:    { type: String, required: true },
  botResponse:  { type: String, required: true },
  emotionCounts: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 }
  },
  timestamp:    { type: Date, default: Date.now }
});

// 4) 모델 생성
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);
const InteractionLog = mongoose.model('InteractionLog', InteractionSchema);

// 5) 내보내기 (server.js에서 사용할 수 있도록)
module.exports = {
  connectDB,
  SearchLog,
  InteractionLog
};
