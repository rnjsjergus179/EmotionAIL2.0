import { dotProduct, softmaxArray, weightedSum, averageVectors, fullyConnected, relu, softmax, vectorMultiply, vectorAdd, sigmoid } from './utils.js';
import { intentWeightMatrix } from './memory.js';

export function buildMLP(inputVector, layers = [128, 64, 32, Object.keys(intentWeightMatrix).length]) {
  let x = inputVector;
  for (let i = 0; i < layers.length - 1; i++) {
    const weights = Array(layers[i]).fill().map(() => Array(x.length).fill(0.01));
    x = fullyConnected(x, weights);
    x = relu(x);
  }
  const outputWeights = Array(layers[layers.length - 1]).fill().map(() => Array(x.length).fill(0.01));
  x = fullyConnected(x, outputWeights);
  return softmax(x);
}

export function selfAttention(embeddings) {
  const query = embeddings;
  const key = embeddings;
  const value = embeddings;
  const scores = dotProduct(query, key) / Math.sqrt(embeddings.length);
  const attentionWeights = softmaxArray([scores]);
  return weightedSum(value, attentionWeights);
}

export function getSequenceEmbedding(historyEmbeddings, currentEmbedding) {
  const all = historyEmbeddings.concat([currentEmbedding]);
  return averageVectors(all);
}

export function updateGRUState(inputEmbedding, prevHidden) {
  const Wz = Array(300).fill(0.01);
  const Wr = Array(300).fill(0.01);
  const Wh = Array(300).fill(0.01);

  const z = sigmoid(dotProduct(Wz, inputEmbedding) + dotProduct(Wz, prevHidden));
  const r = sigmoid(dotProduct(Wr, inputEmbedding) + dotProduct(Wr, prevHidden));
  const hTilde = vectorMultiply(prevHidden, r);
  const newHidden = vectorAdd(vectorMultiply(prevHidden, 1 - z), vectorMultiply(hTilde, z));
  
  return newHidden;
}
