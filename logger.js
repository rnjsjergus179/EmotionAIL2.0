// backend/utils/logger.js

const fs = require('fs');
const path = require('path');

// 로그 폴더 및 파일 경로 설정
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'app.log');

// logs 폴더가 없다면 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 실제 로그를 처리하는 함수
 * @param {'INFO'|'ERROR'|'DEBUG'|'WARN'} level 
 * @param {string} message 
 */
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;

  // 콘솔에도 출력
  switch (level) {
    case 'ERROR':
      console.error(line);
      break;
    case 'WARN':
      console.warn(line);
      break;
    case 'DEBUG':
      console.debug(line);
      break;
    default:
      console.log(line);
  }

  // 파일에 비동기로 추가
  fs.appendFile(logFile, line, 'utf8', err => {
    if (err) {
      // 파일 기록에 실패해도 콘솔에 에러 메시지를 남깁니다.
      console.error(`[${new Date().toISOString()}] [ERROR] Failed to write log: ${err.message}`);
    }
  });
}

module.exports = {
  info:    (msg) => writeLog('INFO', msg),
  error:   (msg) => writeLog('ERROR', msg),
  debug:   (msg) => writeLog('DEBUG', msg),
  warn:    (msg) => writeLog('WARN', msg),
};
