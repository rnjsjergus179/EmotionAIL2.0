const axios = require('axios');
const logger = require('./logger');

async function fetchApi(url, options = {}) {
  try {
    const response = await axios(url, options);
    return response.data;
  } catch (error) {
    logger.error(`API 호출 실패: ${url} - ${error.message}`);
    throw error;
  }
}

module.exports = { fetchApi };
