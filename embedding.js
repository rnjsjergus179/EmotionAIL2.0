// embedding.js

// 환경 변수 로드
require('dotenv').config();

// TensorFlow.js 및 관련 모듈 임포트
const tf = require('@tensorflow/tfjs-node');
const { AutoTokenizer } = require('@xenova/transformers');

// 사전 학습된 모델 경로 (환경 변수에서 가져오거나 기본값 설정)
const MODEL_PATH = process.env.MODEL_PATH || 'https://your-model-url.com/model';

// 모델 및 토크나이저 변수 초기화
let model = null;
let tokenizer = null;

// 모델 로드 함수
async function loadModel() {
  try {
    model = await tf.loadLayersModel(MODEL_PATH);
    console.log('✅ 임베딩 모델 로드 완료');
  } catch (error) {
    console.error('❌ 임베딩 모델 로드 실패:', error.stack);
    throw error;
  }
}

// 토크나이저 로드 함수
async function loadTokenizer() {
  try {
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_PATH);
    console.log('✅ 토크나이저 로드 완료');
  } catch (error) {
    console.error('❌ 토크나이저 로드 실패:', error.stack);
    throw error;
  }
}

// 텍스트를 임베딩으로 변환하는 함수
async function generateEmbedding(text) {
  if (!model || !tokenizer) {
    throw new Error('모델 또는 토크나이저가 로드되지 않았습니다.');
  }

  try {
    // 텍스트를 토큰화
    const inputs = tokenizer(text, { 
      return_tensors: 'tf', 
      padding: true, 
      truncation: true 
    });

    // 모델을 통해 임베딩 생성
    const output = model.predict(inputs);
    const embedding = output.pooler_output.arraySync()[0]; // 임베딩 추출 (모델 구조에 따라 조정 가능)

    return embedding;
  } catch (error) {
    console.error('❌ 임베딩 생성 오류:', error.stack);
    throw error;
  }
}

// 초기화 함수
async function initialize() {
  await loadTokenizer();
  await loadModel();
}

// 모듈 초기화 실행
initialize().catch(err => {
  console.error('❌ embedding.js 초기화 실패:', err.stack);
  process.exit(1);
});

// 모듈 내보내기
module.exports = {
  generateEmbedding
};
