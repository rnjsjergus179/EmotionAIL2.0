// embedding.js

// 환경 변수 로드
require('dotenv').config();

// 필요한 모듈 임포트
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// 프로젝트 루트 디렉토리의 vocab.json 로드
const rootDir = path.resolve(__dirname); // 현재 디렉토리(루트)
const vocabPath = path.join(rootDir, 'vocab.json');

// vocab.json 파일 존재 여부 확인
if (!fs.existsSync(vocabPath)) {
  console.error(`오류: vocab.json 파일이 ${vocabPath}에 존재하지 않습니다.`);
  process.exit(1);
}

// 단어-인덱스 매핑 로드
const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
const VOCAB_SIZE = Object.keys(vocab).length;
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM, 10) || 128;

// 임베딩 행렬 변수 선언
let embeddingMatrix;

/**
 * 임베딩 행렬을 초기화하는 함수
 * 사전학습된 임베딩이 없으면 랜덤 값으로 초기화
 */
async function initializeEmbeddingMatrix() {
  if (process.env.PRETRAINED_EMBED_PATH) {
    console.log('사전학습된 임베딩 로드 기능은 현재 구현되지 않았습니다.');
    // 필요 시 사전학습 임베딩 로드 로직 추가 가능
  } else {
    embeddingMatrix = tf.variable(
      tf.randomNormal([VOCAB_SIZE, EMBEDDING_DIM], 0, 0.1),
      true,
      'embeddingMatrix'
    );
  }
  console.log(`임베딩 행렬 초기화 완료: [${VOCAB_SIZE}, ${EMBEDDING_DIM}]`);
}

/**
 * 토큰 배열을 받아 평균 임베딩 벡터를 생성하는 함수
 * @param {string[]} tokens - 입력 토큰 배열
 * @returns {Promise<number[]>} - 평균 임베딩 벡터 (길이: EMBEDDING_DIM)
 */
async function generateEmbedding(tokens) {
  if (!embeddingMatrix) {
    throw new Error('임베딩 행렬이 초기화되지 않았습니다. 먼저 initializeEmbeddingMatrix를 호출하세요.');
  }

  // 빈 입력 처리
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return Array(EMBEDDING_DIM).fill(0);
  }

  // 토큰을 인덱스로 변환 (<unk> 처리 포함)
  const unkIndex = vocab['<unk>'] || 0;
  const indices = tokens.map(token => vocab[token] ?? unkIndex);

  // 인덱스 텐서 생성
  const idxTensor = tf.tensor1d(indices, 'int32');

  // 임베딩 벡터 조회
  const embeds = tf.gather(embeddingMatrix, idxTensor);

  // 평균 임베딩 계산
  const meanEmbed = embeds.mean(0);

  // 결과를 배열로 변환
  const result = await meanEmbed.array();

  // 메모리 정리
  idxTensor.dispose();
  embeds.dispose();
  meanEmbed.dispose();

  return result;
}

// 임베딩 행렬 초기화 실행
initializeEmbeddingMatrix().catch(err => {
  console.error('임베딩 행렬 초기화 중 오류 발생:', err);
  process.exit(1);
});

// 모듈 내보내기
module.exports = { generateEmbedding };
