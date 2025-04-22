const mongoose = require('mongoose');
const logger = require('../utils/logger');

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

module.exports = connectDB;
