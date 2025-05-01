// embedding.js

// 환경 변수 로드
require('dotenv').config();

// TensorFlow.js 및 파일 시스템 모듈 임포트
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// Vocabulary mapping (DB에서 내려받은 토큰에 매핑할 사전)
// vocab.json 파일이 현재 디렉토리에 있어야 함
const vocabPath = path.join(__dirname, 'vocab.json');
if (!fs.existsSync(vocabPath)) {
  console.error(`vocab.json 파일이 ${vocabPath}에 없습니다.`);
  process.exit(1);
}
const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
const VOCAB_SIZE = Object.keys(vocab).length;
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM, 10) || 128;

// 임베딩 행렬 초기화 (랜덤 또는 사전학습 가중치 로드)
let embeddingMatrix;

async function initializeEmbeddingMatrix() {
  if (process.env.PRETRAINED_EMBED_PATH) {
    // 사전학습된 임베딩 로드 (예: TensorFlow SavedModel, npy 등)
    // TODO: PRETRAINED_EMBED_PATH에 맞는 로드 로직을 구현하세요.
    // 예시: TensorFlow.js 모델 로드
    // embeddingMatrix = await tf.loadLayersModel(process.env.PRETRAINED_EMBED_PATH);
    console.log('사전학습 임베딩 로드를 구현하세요.');
  } else {
    // 사전학습된 임베딩이 없으면 랜덤으로 초기화
    embeddingMatrix = tf.variable(
      tf.randomNormal([VOCAB_SIZE, EMBEDDING_DIM], 0, 0.1),
      true,
      'embeddingMatrix'
    );
  }
  console.log(`Embedding matrix initialized: [${VOCAB_SIZE}, ${EMBEDDING_DIM}]`);
}

/**
 * @param {string[]} tokens - 자모음/영단어 토큰 배열
 * @returns {Promise<number[]>} - 평균 임베딩 벡터 (length = EMBEDDING_DIM)
 */
async function generateEmbedding(tokens) {
  if (!embeddingMatrix) {
    throw new Error('Embedding matrix가 초기화되지 않았습니다.');
  }
  if (!Array.isArray(tokens) || tokens.length === 0) {
    // 빈 입력 시 0벡터 반환
    return Array(EMBEDDING_DIM).fill(0);
  }

  // 1) 토큰 → 인덱스로 매핑 (없으면 <unk> 이용)
  const unkIndex = vocab['<unk>'] || 0;
  const indices = tokens.map(t => (vocab[t] !== undefined ? vocab[t] : unkIndex));

  // 2) Tensor 생성 (shape: [seq_len])
  const idxTensor = tf.tensor1d(indices, 'int32');

  // 3) 임베딩 조회 (shape: [seq_len, EMBEDDING_DIM])
  const embeds = tf.gather(embeddingMatrix, idxTensor);

  // 4) 평균 계산 (shape: [EMBEDDING_DIM])
  const meanEmbed = embeds.mean(0);

  // 5) JS 배열로 변환
  const result = await meanEmbed.array();

  // 메모리 해제
  idxTensor.dispose();
  embeds.dispose();
  meanEmbed.dispose();

  return result;
}

// 초기화 실행
initializeEmbeddingMatrix().catch(err => {
  console.error('Embedding matrix 초기화 실패:', err);
  process.exit(1);
});

// 모듈 내보내기
module.exports = { generateEmbedding };
