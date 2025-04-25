// backend/db.js

const mongoose = require('mongoose');
const logger = require('./logger.js');

// 1) Connect 함수
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB에 연결되었습니다.');
  } catch (error) {
    logger.error(`MongoDB 연결 실패: ${error.message}`);
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
  query: { 
    type: String, 
    required: true 
  },
  tokens: [String],                         // NLP 파이프라인을 거쳐 분할된 토큰
  results: mongoose.Schema.Types.Mixed,     // API 결과 원본
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 3) InteractionLog 스키마 정의 (반복 학습용)
const InteractionSchema = new mongoose.Schema({
  userInput: { 
    type: String, 
    required: true 
  },
  botResponse: { 
    type: String, 
    required: true 
  },
  emotionCounts: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 }
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// 4) 모델 생성
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);
const InteractionLog = mongoose.model('InteractionLog', InteractionSchema);

// 5) 모듈로 내보내기
module.exports = {
  connectDB,
  SearchLog,
  InteractionLog
};
