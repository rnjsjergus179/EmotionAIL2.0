const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/app.log');

function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage, 'utf8');
}

module.exports = {
  info: (message) => log('INFO', message),
  error: (message) => log('ERROR', message)
};
