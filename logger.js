// logger.js (루트 디렉토리에 위치)

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// DB 연결 및 모델 (루트 디렉토리에 db.js가 있다고 가정)
const { connectDB, ApiLog } = require('./db');

// 1) 로그 폴더 및 파일 경로 설정 (루트 디렉토리/logs/app.log)
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'app.log');

// 2) logs 폴더가 없다면 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 3) DB 연결 (한 번만 실행)
connectDB().catch(err => {
  console.error('DB 연결 오류:', err);
  process.exit(1);
});

/**
 * 실제 로그를 처리하는 함수
 * @param {'INFO'|'ERROR'|'DEBUG'|'WARN'} level - 로그 레벨
 * @param {string} message - 로그 메시지
 */
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;
  
  // 콘솔에 레벨별 출력
  switch (level) {
    case 'ERROR': console.error(line.trim()); break;
    case 'WARN':  console.warn(line.trim()); break;
    case 'DEBUG': console.log(line.trim()); break; // console.debug 대신 log 사용
    default:      console.log(line.trim());
  }

  // 파일에 비동기로 기록
  fs.appendFile(logFile, line, 'utf8', err => {
    if (err) {
      console.error(
        `[${new Date().toISOString()}] [ERROR] 로그 파일 쓰기 실패: ${err.message}`
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
  // DB 연결 상태 확인
  if (mongoose.connection.readyState !== 1) {
    writeLog('ERROR', 'DB가 연결되지 않았습니다. 데이터를 저장할 수 없습니다.');
    return;
  }
  
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
