export function fullyConnected(input, weights) {
  return weights.map(row => dotProduct(input, row));
}

export function relu(vector) {
  return vector.map(val => Math.max(0, val));
}

export function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

export function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

export function weightedSum(values, weights) {
  return values.map((val, i) => val * weights[i]).reduce((a, b) => a + b, 0);
}

export function averageVectors(vectors) {
  if (vectors.length === 0) return Array(300).fill(0);
  const sum = vectors.reduce((acc, vec) => acc.map((val, i) => val + vec[i]), Array(vectors[0].length).fill(0));
  return sum.map(val => val / vectors.length);
}

export function softmaxArray(arr) {
  const maxVal = Math.max(...arr);
  const exps = arr.map(val => Math.exp(val - maxVal));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

export function vectorAdd(a, b) {
  return a.map((val, i) => val + b[i]);
}

export function vectorSubtract(a, b) {
  return a.map((val, i) => val - b[i]);
}

export function vectorMultiply(a, scalar) {
  return a.map(val => val * scalar);
}

export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
