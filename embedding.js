// embedding.js

// 환경 변수 로드
require('dotenv').config();

// TensorFlow.js 및 Universal Sentence Encoder 임포트
const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');

// 모델 변수
let model = null;

// 모델 로드 함수
async function loadModel() {
  try {
    model = await use.load();
    console.log('✅ Universal Sentence Encoder 로드 완료');
  } catch (err) {
    console.error('❌ USE 모델 로드 실패:', err);
    throw err;
  }
}

// 텍스트를 임베딩으로 변환하는 함수
// - 입력: 단일 문자열 또는 문자열 배열
// - 출력: Float32Array (첫 번째 문장 임베딩)
async function generateEmbedding(text) {
  if (!model) {
    throw new Error('모델이 로드되지 않았습니다. initialize()를 먼저 호출하세요.');
  }

  try {
    const embeddings = await model.embed(text);
    const array = embeddings.arraySync();
    return Array.isArray(text)
      ? array      // 배열 모드: 모든 문장에 대한 배열 리턴
      : array[0];  // 단일 문자열: 첫 번째 임베딩만 리턴
  } catch (err) {
    console.error('❌ 임베딩 생성 중 오류:', err);
    throw err;
  }
}

// 초기화 실행
async function initialize() {
  await loadModel();
}
initialize().catch(err => {
  console.error('❌ embedding.js 초기화 실패:', err);
  process.exit(1);
});

// 모듈 내보내기
module.exports = { generateEmbedding };
