/**
 * Calculate weighted average
 */
export function calculateWeightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length) {
    throw new Error('Values and weights arrays must have the same length');
  }

  if (values.length === 0) {
    return 0;
  }

  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(values: number[], confidence: number = 0.95): { lower: number; upper: number; mean: number } {
  if (values.length === 0) {
    return { lower: 0, upper: 0, mean: 0 };
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const stdDev = calculateStandardDeviation(values);
  const n = values.length;

  // Using t-distribution approximation for small samples
  const tValue = getTValue(confidence, n - 1);
  const marginOfError = tValue * (stdDev / Math.sqrt(n));

  return {
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    mean
  };
}

/**
 * Calculate correlation coefficient
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, index) => sum + val * y[index], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  }

  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate entropy (information theory)
 */
export function calculateEntropy(probabilities: number[]): number {
  return probabilities.reduce((entropy, prob) => {
    if (prob === 0) return entropy;
    return entropy - prob * Math.log2(prob);
  }, 0);
}

/**
 * Calculate Gini coefficient
 */
export function calculateGiniCoefficient(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((total, value) => total + value, 0);

  if (sum === 0) {
    return 0;
  }

  let gini = 0;
  for (let i = 0; i < n; i++) {
    gini += (2 * (i + 1) - n - 1) * sorted[i];
  }

  return gini / (n * sum);
}

/**
 * Calculate trend (linear regression slope)
 */
export function calculateTrend(x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, index) => sum + val * y[index], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, val, index) => {
    const predicted = slope * x[index] + intercept;
    return sum + Math.pow(val - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

  return { slope, intercept, rSquared };
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(values: number[], windowSize: number): number[] {
  if (values.length === 0 || windowSize <= 0) {
    return [];
  }

  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }

  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateExponentialMovingAverage(values: number[], alpha: number): number[] {
  if (values.length === 0 || alpha <= 0 || alpha > 1) {
    return [];
  }

  const result: number[] = [];
  let ema = values[0];
  result.push(ema);

  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema;
    result.push(ema);
  }

  return result;
}

/**
 * Calculate similarity between two arrays
 */
export function calculateSimilarity(a: number[], b: number[], method: 'cosine' | 'euclidean' | 'pearson' = 'cosine'): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  switch (method) {
    case 'cosine':
      return calculateCosineSimilarity(a, b);
    case 'euclidean':
      return calculateEuclideanSimilarity(a, b);
    case 'pearson':
      return Math.abs(calculateCorrelation(a, b));
    default:
      return 0;
  }
}

/**
 * Calculate cosine similarity
 */
function calculateCosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, index) => sum + val * b[index], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate Euclidean similarity (inverse of distance)
 */
function calculateEuclideanSimilarity(a: number[], b: number[]): number {
  const distance = Math.sqrt(a.reduce((sum, val, index) => sum + Math.pow(val - b[index], 2), 0));
  return 1 / (1 + distance);
}

/**
 * Get t-value for confidence interval calculation
 */
function getTValue(confidence: number, degreesOfFreedom: number): number {
  // Simplified t-value lookup table for common confidence levels
  const tTable: Record<number, Record<number, number>> = {
    0.90: { 1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 10: 1.812, 20: 1.725, 30: 1.697, 100: 1.660 },
    0.95: { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 10: 2.228, 20: 2.086, 30: 2.042, 100: 1.984 },
    0.99: { 1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 10: 3.169, 20: 2.845, 30: 2.750, 100: 2.626 }
  };

  const confidenceKey = Math.round(confidence * 100) / 100;
  const dfKey = degreesOfFreedom >= 100 ? 100 : degreesOfFreedom;

  return tTable[confidenceKey]?.[dfKey] || 1.96; // Default to 1.96 for large samples
}

/**
 * Normalize values to 0-1 range
 */
export function normalize(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return values.map(() => 0.5);
  }

  return values.map(value => (value - min) / (max - min));
}

/**
 * Calculate z-score
 */
export function calculateZScore(value: number, values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = calculateStandardDeviation(values);

  return stdDev === 0 ? 0 : (value - mean) / stdDev;
}

/**
 * Calculate outliers using IQR method
 */
export function findOutliers(values: number[]): { outliers: number[]; indices: number[] } {
  if (values.length < 4) {
    return { outliers: [], indices: [] };
  }

  const q1 = calculatePercentile(values, 25);
  const q3 = calculatePercentile(values, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const indices: number[] = [];

  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outliers.push(value);
      indices.push(index);
    }
  });

  return { outliers, indices };
}