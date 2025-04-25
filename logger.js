// logger.js (프로젝트 루트에 위치)

const fs = require('fs');
const path = require('path');

// DB 연결 및 모델
const { connectDB, ApiLog } = require('./backend/db');

// 1) 로그 폴더 및 파일 경로 설정 (프로젝트 루트/logs/app.log)
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'app.log');

// 2) logs 폴더가 없다면 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 3) DB 연결 (한 번만)
connectDB().catch(err => {
  console.error('DB 연결 오류:', err);
  process.exit(1);
});

/**
 * 실제 로그를 처리하는 함수
 * @param {'INFO'|'ERROR'|'DEBUG'|'WARN'} level 
 * @param {string} message 
 */
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;
  
  // --- 1) 콘솔에도 레벨별 출력 ---
  switch (level) {
    case 'ERROR': console.error(line.trim()); break;
    case 'WARN':  console.warn(line.trim()); break;
    case 'DEBUG': console.log(line.trim()); break; // console.debug 대신 log 사용
    default:      console.log(line.trim());
  }

  // --- 2) 파일에 비동기로 추가 ---
  fs.appendFile(logFile, line, 'utf8', err => {
    if (err) {
      console.error(
        `[${new Date().toISOString()}] [ERROR] Failed to write log file: ${err.message}`
      );
    }
  });
}

/**
 * API 데이터를 MongoDB에 저장하는 함수
 * @param {string} apiType - API 유형 ('naver' 또는 'youtube')
 * @param {string} query - API에 전달된 쿼리
 * @param {Object} response - API 응답 데이터
 */
async function saveApiData(apiType, query, response) {
  const timestamp = new Date().toISOString();
  try {
    await ApiLog.create({ apiType, query, response, timestamp });
    writeLog('INFO', `${apiType} API 데이터 저장 성공: ${query}`);
  } catch (err) {
    writeLog('ERROR', `API 데이터 저장 실패: ${err.message}`);
  }
}

module.exports = {
  info: (msg) => writeLog('INFO', msg),
  error: (msg) => writeLog('ERROR', msg),
  warn: (msg) => writeLog('WARN', msg),
  debug: (msg) => writeLog('DEBUG', msg),
  saveApiData,
};
