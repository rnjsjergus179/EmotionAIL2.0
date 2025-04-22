const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`에러 발생: ${err.stack}`);
  res.status(500).json({
    error: '서버 내부 오류가 발생했습니다.',
    message: err.message
  });
}

module.exports = { errorHandler };
