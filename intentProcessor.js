// intentProcessor.js

import {
  dotProduct,
  vectorAdd,
  vectorMultiply,
  averageVectors,
  normalizeVector,
  sigmoid,
  fullyConnected,
  relu,
  softmax,
  quantizeVector,
  textToBinaryVector
} from './utils.js';

const API_BASE_URL = 'https://emotionail2-0.onrender.com';

// API 호출 함수
async function getEmbedding(text) {
  const binary = textToBinaryVector(text);
  try {
    const response = await fetch(`${API_BASE_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const { embedding } = await response.json();
    return embedding ? quantizeVector(embedding) : binary;
  } catch (error) {
    console.error("임베딩 API 호출 실패:", error);
    return binary;
  }
}

async function processText(text) {
  if (!text || typeof text !== 'string') return "";
  try {
    const response = await fetch(`${API_BASE_URL}/api/morph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const { analyzed } = await response.json();
    return analyzed ? analyzed.join(' ') : text;
  } catch (error) {
    console.error("형태소 분석 실패:", error);
    return text;
  }
}

// GRU 상태 업데이트
function updateGRUState(inputEmbedding, prevHidden) {
  const Wz = Array(300).fill(0.01);
  const Wr = Array(300).fill(0.01);
  const Wh = Array(300).fill(0.01);

  const z = sigmoid(dotProduct(Wz, inputEmbedding) + dotProduct(Wz, prevHidden));
  const r = sigmoid(dotProduct(Wr, inputEmbedding) + dotProduct(Wr, prevHidden));
  const hTilde = vectorMultiply(prevHidden, r);
  const newHidden = vectorAdd(vectorMultiply(prevHidden, 1 - z), vectorMultiply(hTilde, z));
  
  return quantizeVector(newHidden);
}

// MLP 구현
function buildMLP(inputVector, layers = [256, 128, 64, 32, Object.keys(intentWeightMatrix).length]) {
  let x = quantizeVector(inputVector);
  const weights = [];
  for (let i = 0; i < layers.length - 1; i++) {
    weights.push(Array(layers[i]).fill().map(() => Array(x.length).fill(Math.random() * 0.02 - 0.01)));
    x = fullyConnected(x, weights[i]);
    x = relu(x);
    x = quantizeVector(x);
  }
  const outputWeights = Array(layers[layers.length - 1]).fill().map(() => Array(x.length).fill(Math.random() * 0.02 - 0.01));
  x = fullyConnected(x, outputWeights);
  return softmax(x);
}

// 시퀀스 임베딩
function getSequenceEmbedding(historyEmbeddings, currentEmbedding) {
  const all = historyEmbeddings.concat([quantizeVector(currentEmbedding)]);
  return averageVectors(all);
}

// 의도 분류기
async function softmaxIntentClassifier(inputText, historyEmbeddings, intentWeightMatrix) {
  const inputBinary = textToBinaryVector(inputText);
  const inputEmbedding = await getEmbedding(inputText);
  const sequenceEmbedding = getSequenceEmbedding(historyEmbeddings, inputEmbedding);
  const normalizedEmbedding = normalizeVector(sequenceEmbedding);

  let logits = {};
  for (let intent in intentWeightMatrix) {
    logits[intent] = dotProduct(normalizedEmbedding, intentWeightMatrix[intent]);
  }

  const probabilities = buildMLP(normalizedEmbedding);
  const intentKeys = Object.keys(intentWeightMatrix);
  const intentProbs = {};
  let maxProb = 0;
  let detectedIntent = null;

  intentKeys.forEach((intent, i) => {
    intentProbs[intent] = probabilities[i];
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      detectedIntent = intent;
    }
  });

  return maxProb >= 0.5 ? { intent: detectedIntent, probabilities: intentProbs, embedding: inputBinary } : { intent: 'unknown', probabilities: intentProbs, embedding: inputBinary };
}

export {
  getEmbedding,
  processText,
  updateGRUState,
  buildMLP,
  getSequenceEmbedding,
  softmaxIntentClassifier
};
