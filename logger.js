// logger.js  (프로젝트 루트에 위치)

const fs       = require('fs');
const path     = require('path');
const mongoose = require('mongoose');

// ——————————————————————————————————————————————————————
// 1) MongoDB 연결 및 스키마/모델 정의
//    (db.js 대신 이 파일에서 직접 정의합니다)
// ——————————————————————————————————————————————————————

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('[DB] MongoDB 연결 성공');
  } catch (err) {
    console.error('[DB] MongoDB 연결 실패:', err.message);
    process.exit(1);
  }
}
connectDB();

// SearchLog 스키마
const SearchLogSchema = new mongoose.Schema({
  source:    { type: String, enum: ['google','youtube','naver'], required: true },
  query:     { type: String, required: true },
  tokens:    [String],
  results:   mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

// InteractionLog 스키마
const InteractionLogSchema = new mongoose.Schema({
  userInput:     { type: String, required: true },
  botResponse:   { type: String, required: true },
  emotionCounts: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 }
  },
  timestamp: { type: Date, default: Date.now }
});

const SearchLog       = mongoose.model('SearchLog',       SearchLogSchema);
const InteractionLog  = mongoose.model('InteractionLog',  InteractionLogSchema);

// ——————————————————————————————————————————————————————
// 2) 로그 파일 세팅
// ——————————————————————————————————————————————————————
const logDir  = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'app.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ——————————————————————————————————————————————————————
// 3) 실제 로그 처리 함수
// ——————————————————————————————————————————————————————
async function writeLog(level, message, meta = {}) {
  const ts   = new Date().toISOString();
  const line = `[${ts}] [${level}] ${message}\n`;

  // 3-a) 콘솔 출력
  switch (level) {
    case 'ERROR': console.error(line.trim()); break;
    case 'WARN':  console.warn(line.trim());  break;
    case 'DEBUG': console.debug(line.trim()); break;
    default:      console.log(line.trim());
  }

  // 3-b) 파일에 비동기 추가
  fs.appendFile(logFile, line, 'utf8', err => {
    if (err) {
      console.error(`[${new Date().toISOString()}] [ERROR] 로그 파일 기록 실패: ${err.message}`);
    }
  });

  // 3-c) DB 저장
  try {
    if (meta.source && meta.query) {
      // API 호출 로그
      await SearchLog.create({
        source:  meta.source,
        query:   meta.query,
        tokens:  meta.tokens || [],
        results: meta.results
      });
    }
    else if (meta.userInput !== undefined && meta.botResponse !== undefined) {
      // 대화 학습 로그
      await InteractionLog.create({
        userInput:     meta.userInput,
        botResponse:   meta.botResponse,
        emotionCounts: meta.emotionCounts || {}
      });
    }
  } catch (dbErr) {
    console.error(`[${new Date().toISOString()}] [ERROR] DB 저장 실패: ${dbErr.message}`);
  }
}

// ——————————————————————————————————————————————————————
// 4) 외부 호출용 인터페이스
// ——————————————————————————————————————————————————————
module.exports = {
  info:    (msg, meta) => writeLog('INFO',  msg, meta),
  warn:    (msg, meta) => writeLog('WARN',  msg, meta),
  error:   (msg, meta) => writeLog('ERROR', msg, meta),
  debug:   (msg, meta) => writeLog('DEBUG', msg, meta),
};
