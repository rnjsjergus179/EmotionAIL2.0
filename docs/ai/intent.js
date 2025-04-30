import { API_BASE_URL, knowledgeGraph } from './config.js';
import { logToServer, getEmbedding } from './api.js';
import { getSequenceEmbedding, selfAttention, updateGRUState } from './ai/ml.js';
import { intentWeightMatrix, gruHiddenState, historyEmbeddings, adaptiveLearningRate } from './memory.js';
import { dotProduct, vectorAdd, vectorMultiply } from './utils.js';

export async function softmaxIntentClassifier(inputText, historyEmbeddings) {
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

export function updateIntentWeights(inputEmbedding, predictedIntent, userFeedback) {
  const reward = userFeedback === "positive" ? 1 : userFeedback === "negative" ? -1 : 0;

  for (let intent in intentWeightMatrix) {
    const grad = intent === predictedIntent ? reward : -reward / (Object.keys(intentWeightMatrix).length - 1);
    intentWeightMatrix[intent] = vectorAdd(
      intentWeightMatrix[intent],
      vectorMultiply(inputEmbedding, adaptiveLearningRate * grad)
    );
  }
}

export async function detectIntent(input, processedData) {
  const { intent, probabilities, embedding } = await softmaxIntentClassifier(input, historyEmbeddings);
  gruHiddenState = updateGRUState(embedding, gruHiddenState);

  for (let concept in knowledgeGraph) {
    if (input.includes(concept)) {
      const relatedIntents = knowledgeGraph[concept];
      relatedIntents.forEach(relatedIntent => {
        if (probabilities[relatedIntent]) {
          probabilities[relatedIntent] *= 1.2;
        }
      });
    }
  }

  let maxProb = 0;
  let detectedIntent = null;
  for (let intent in probabilities) {
    if (probabilities[intent] > maxProb) {
      maxProb = probabilities[intent];
      detectedIntent = intent;
    }
  }

  if (probabilities[detectedIntent] > 0.5) {
    return detectedIntent;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, processedData })
    });
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
    const data = await response.json();
    await logToServer("의도 인식 API 호출 성공");
    return data.intent || null;
  } catch (error) {
    await logToServer(`의도 인식 API 호출 실패: ${error.message}`);
    return null;
  }
    }
