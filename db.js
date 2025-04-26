// db.js
require('dotenv').config();
const mongoose = require('mongoose');

// (생략: connectDB, 스키마 정의, tokenizeQuery, recognizeIntent ...)

// --- 1) 객체에서 문자열만 추출해 줄 “텍스트 라인” 생성 함수 ---
function extractLines(obj) {
  const lines = [];

  function recurse(v) {
    if (Array.isArray(v)) {
      v.forEach(recurse);
    } else if (v && typeof v === 'object') {
      Object.values(v).forEach(recurse);
    } else if (typeof v === 'string') {
      // 문장 단위로 분리할 필요가 있으면 split('\n') 처리해도 OK
      lines.push(v.trim());
    }
  }

  recurse(obj);
  return lines;
}

// --- 2) saveSearchData 수정 ---
async function saveSearchData(source, query, resultsData) {
  console.log(`[saveSearchData] source=${source}, query=${query}`);

  // a) resultsData로부터 “텍스트 라인” 뽑아내기
  let textLines;
  if (typeof resultsData === 'string') {
    textLines = resultsData.split('\n');
  } else {
    textLines = extractLines(resultsData);
  }
  console.log(`[saveSearchData] 추출된 라인 수: ${textLines.length}`);

  // b) 각 줄을 자모 토큰화
  const tokenizedResults = textLines.map(line => tokenizeQuery(line));

  // c) 검색어 토큰화 + 의도 인식
  const tokens = tokenizeQuery(query);
  const intent = recognizeIntent(query);

  // d) MongoDB 저장
  const doc = new SearchLog({
    source,
    query,
    tokens,
    intent,
    results: tokenizedResults
  });
  const saved = await doc.save();
  console.log(`[saveSearchData] 저장 완료 _id=${saved._id}`);
}

module.exports = {
  connectDB,
  saveSearchData
};
