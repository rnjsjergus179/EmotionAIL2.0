import { fullyConnected, relu, softmax, dotProduct, weightedSum, averageVectors, softmaxArray, vectorAdd, vectorMultiply, sigmoid } from './utils.js';

function buildMLP(inputVector, layers = [128, 64, 32]) {
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

function selfAttention(embeddings) {
  const query = embeddings;
  const key = embeddings;
  const value = embeddings;
  const scores = dotProduct(query, key) / Math.sqrt(embeddings.length);
  const attentionWeights = softmaxArray([scores]);
  return weightedSum(value, attentionWeights);
}

function getSequenceEmbedding(historyEmbeddings, currentEmbedding) {
  const all = historyEmbeddings.concat([currentEmbedding]);
  return averageVectors(all);
}

function updateGRUState(inputEmbedding, prevHidden) {
  const Wz = Array(300).fill(0.01); // 업데이트 게이트 가중치
  const Wr = Array(300).fill(0.01); // 리셋 게이트 가중치
  const Wh = Array(300).fill(0.01); // 히든 상태 가중치

  const z = sigmoid(dotProduct(Wz, inputEmbedding) + dotProduct(Wz, prevHidden));
  const r = sigmoid(dotProduct(Wr, inputEmbedding) + dotProduct(Wr, prevHidden));
  const hTilde = vectorMultiply(prevHidden, r);
  const newHidden = vectorAdd(vectorMultiply(prevHidden, 1 - z), vectorMultiply(hTilde, z));
  return newHidden;
}

async function softmaxIntentClassifier(inputText, historyEmbeddings, intentWeightMatrix, getEmbedding) {
  const inputEmbedding = await getEmbedding(inputText);
  const sequenceEmbedding = getSequenceEmbedding(historyEmbeddings, inputEmbedding);
  const attendedEmbedding = selfAttention(sequenceEmbedding);

  let logits = {};
  let expSum = 0;

  for (let intent in intentWeightMatrix) {
    logits[intent] = dotProduct(attendedEmbedding, intentWeightMatrix[intent]);
    expSum += Math.exp(logits[intent]);
  }

  let probabilities = {};
  for (let intent in logits) {
    probabilities[intent] = Math.exp(logits[intent]) / expSum;
  }

  let maxProb = 0;
  let detectedIntent = null;
  for (let intent in probabilities) {
    if (probabilities[intent] > maxProb) {
      maxProb = probabilities[intent];
      detectedIntent = intent;
    }
  }

  return { intent: detectedIntent, probabilities, embedding: attendedEmbedding };
}

function updateIntentWeights(inputEmbedding, predictedIntent, userFeedback, intentWeightMatrix, adaptiveLearningRate) {
  const reward = userFeedback === "positive" ? 1 : userFeedback === "negative" ? -1 : 0;

  for (let intent in intentWeightMatrix) {
    const grad = intent === predictedIntent ? reward : -reward / (Object.keys(intentWeightMatrix).length - 1);
    intentWeightMatrix[intent] = vectorAdd(
      intentWeightMatrix[intent],
      vectorMultiply(inputEmbedding, adaptiveLearningRate * grad)
    );
  }
}

export { buildMLP, selfAttention, getSequenceEmbedding, updateGRUState, softmaxIntentClassifier, updateIntentWeights };

