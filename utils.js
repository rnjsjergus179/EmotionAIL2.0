// utils.js

// 벡터 연산 함수
function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function vectorAdd(a, b) {
  return a.map((val, i) => val + b[i]);
}

function vectorSubtract(a, b) {
  return a.map((val, i) => val - b[i]);
}

function vectorMultiply(a, scalar) {
  return a.map(val => val * scalar);
}

function weightedSum(values, weights) {
  return values.map((val, i) => val * weights[i]).reduce((a, b) => a + b, 0);
}

function averageVectors(vectors) {
  if (vectors.length === 0) return Array(300).fill(0);
  const sum = vectors.reduce((acc, vec) => acc.map((val, i) => val + vec[i]), Array(vectors[0].length).fill(0));
  return sum.map(val => val / vectors.length);
}

function normalizeVector(vector) {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / (norm || 1));
}

// 활성화 함수
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function relu(vector) {
  return vector.map(val => Math.max(0, val));
}

function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

function softmaxArray(arr) {
  const maxVal = Math.max(...arr);
  const exps = arr.map(val => Math.exp(val - maxVal));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

// 신경망 관련 함수
function fullyConnected(input, weights) {
  return weights.map(row => dotProduct(input, row));
}

function quantizeVector(vector) {
  return vector.map(val => val > 0.5 ? 1 : 0);
}

// 텍스트 처리 함수
function textToBinaryVector(text) {
  const binary = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i).toString(2).padStart(8, '0');
    binary.push(...charCode.split('').map(Number));
  }
  return binary.length > 300 ? binary.slice(0, 300) : binary.concat(Array(300 - binary.length).fill(0));
}

function binaryVectorToText(binary) {
  let text = '';
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8).join('');
    text += String.fromCharCode(parseInt(byte, 2));
  }
  return text;
}

// Jaccard 유사도 함수
function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1);
  const set2 = new Set(str2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

export {
  dotProduct,
  vectorAdd,
  vectorSubtract,
  vectorMultiply,
  weightedSum,
  averageVectors,
  normalizeVector,
  sigmoid,
  relu,
  softmax,
  softmaxArray,
  fullyConnected,
  quantizeVector,
  textToBinaryVector,
  binaryVectorToText,
  jaccardSimilarity
};
