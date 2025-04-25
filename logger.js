// logger.js (프로젝트 루트에 위치)

const fs   = require('fs');
const path = require('path');

// 1) 로그 폴더 및 파일 경로 설정 (프로젝트 루트/logs/app.log)
const logDir  = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'app.log');

// 2) logs 폴더가 없다면 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 실제 로그를 처리하는 함수
 * @param {'INFO'|'ERROR'|'DEBUG'|'WARN'} level - 로그 레벨
 * @param {string} message - 로그 메시지
 */
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const line      = `[${timestamp}] [${level}] ${message}\n`;

  // 콘솔에 레벨별 출력
  switch (level) {
    case 'ERROR':
      console.error(line.trim());
      break;
    case 'WARN':
      console.warn(line.trim());
      break;
    case 'DEBUG':
      console.debug(line.trim());
      break;
    default:
      console.log(line.trim());
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

module.exports = {
  info:  (msg) => writeLog('INFO',  msg),
  warn:  (msg) => writeLog('WARN',  msg),
  error: (msg) => writeLog('ERROR', msg),
  debug: (msg) => writeLog('DEBUG', msg),
};
