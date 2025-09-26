import { z } from 'zod';

// ML Bias Detection schemas
const BiasFeatureSchema = z.object({
  name: z.string(),
  value: z.number(),
  weight: z.number(),
  description: z.string()
});

const BiasPredictionSchema = z.object({
  biasType: z.string(),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high']),
  features: z.array(BiasFeatureSchema),
  explanation: z.string(),
  recommendations: z.array(z.string())
});

const BiasModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  accuracy: z.number(),
  lastTrained: z.date(),
  features: z.array(z.string()),
  biasTypes: z.array(z.string())
});

export type BiasFeature = z.infer<typeof BiasFeatureSchema>;
export type BiasPrediction = z.infer<typeof BiasPredictionSchema>;
export type BiasModel = z.infer<typeof BiasModelSchema>;

export class MLBiasService {
  private models = new Map<string, BiasModel>();
  private featureExtractors = new Map<string, (data: Record<string, unknown>) => BiasFeature[]>();

  constructor() {
    this.initializeDefaultModels();
    this.initializeFeatureExtractors();
  }

  private initializeDefaultModels(): void {
    // Confirmation Bias Model
    this.models.set('confirmation_bias', {
      id: 'confirmation_bias',
      name: 'Confirmation Bias Detector',
      version: '1.0.0',
      accuracy: 0.78,
      lastTrained: new Date(),
      features: ['evidence_balance', 'contradictory_evidence', 'search_pattern', 'conclusion_rigidity'],
      biasTypes: ['confirmation_bias', 'cherry_picking', 'motivated_reasoning']
    });

    // Anchoring Bias Model
    this.models.set('anchoring_bias', {
      id: 'anchoring_bias',
      name: 'Anchoring Bias Detector',
      version: '1.0.0',
      accuracy: 0.82,
      lastTrained: new Date(),
      features: ['first_impression_weight', 'adjustment_range', 'reference_points', 'decision_consistency'],
      biasTypes: ['anchoring_bias', 'adjustment_bias', 'reference_point_bias']
    });

    // Availability Bias Model
    this.models.set('availability_bias', {
      id: 'availability_bias',
      name: 'Availability Bias Detector',
      version: '1.0.0',
      accuracy: 0.75,
      lastTrained: new Date(),
      features: ['recent_examples', 'vivid_examples', 'statistical_evidence', 'personal_experience'],
      biasTypes: ['availability_bias', 'recency_bias', 'vividness_bias']
    });

    // Groupthink Model
    this.models.set('groupthink', {
      id: 'groupthink',
      name: 'Groupthink Detector',
      version: '1.0.0',
      accuracy: 0.73,
      lastTrained: new Date(),
      features: ['consensus_pressure', 'dissent_absence', 'group_cohesion', 'external_criticism'],
      biasTypes: ['groupthink', 'conformity_bias', 'bandwagon_effect']
    });
  }

  private initializeFeatureExtractors(): void {
    // Confirmation Bias Feature Extractor
    this.featureExtractors.set('confirmation_bias', (data: Record<string, unknown>) => {
      const features: BiasFeature[] = [];
      
      // Evidence balance feature
      const supportingEvidence = (data.evidence as Array<{ supports: boolean }> || []).filter((e) => e.supports === true).length;
      const contradictingEvidence = (data.evidence as Array<{ supports: boolean }> || []).filter((e) => e.supports === false).length;
      const totalEvidence = supportingEvidence + contradictingEvidence;
      const evidenceBalance = totalEvidence > 0 ? Math.abs(supportingEvidence - contradictingEvidence) / totalEvidence : 0;
      
      features.push({
        name: 'evidence_balance',
        value: evidenceBalance,
        weight: 0.3,
        description: 'Balance between supporting and contradicting evidence'
      });

      // Contradictory evidence handling
      const contradictoryEvidenceHandled = (data.contradictoryEvidenceHandled as number) || 0;
      features.push({
        name: 'contradictory_evidence',
        value: contradictoryEvidenceHandled,
        weight: 0.25,
        description: 'How well contradictory evidence is addressed'
      });

      // Search pattern (simplified)
      const searchBreadth = (data.searchBreadth as number) || 0.5;
      features.push({
        name: 'search_pattern',
        value: searchBreadth,
        weight: 0.25,
        description: 'Breadth of information search'
      });

      // Conclusion rigidity
      const conclusionChanges = (data.conclusionChanges as number) || 0;
      features.push({
        name: 'conclusion_rigidity',
        value: Math.max(0, 1 - conclusionChanges),
        weight: 0.2,
        description: 'How rigid the conclusion is'
      });

      return features;
    });

    // Anchoring Bias Feature Extractor
    this.featureExtractors.set('anchoring_bias', (data: Record<string, unknown>) => {
      const features: BiasFeature[] = [];
      
      // First impression weight
      const firstImpressionWeight = (data.firstImpressionWeight as number) || 0.5;
      features.push({
        name: 'first_impression_weight',
        value: firstImpressionWeight,
        weight: 0.4,
        description: 'Weight given to first impression or initial information'
      });

      // Adjustment range
      const adjustmentRange = (data.adjustmentRange as number) || 0.5;
      features.push({
        name: 'adjustment_range',
        value: adjustmentRange,
        weight: 0.3,
        description: 'Range of adjustments made from initial anchor'
      });

      // Reference points
      const referencePoints = (data.referencePoints as number) || 1;
      features.push({
        name: 'reference_points',
        value: Math.min(1, referencePoints / 5),
        weight: 0.2,
        description: 'Number of reference points considered'
      });

      // Decision consistency
      const decisionConsistency = (data.decisionConsistency as number) || 0.5;
      features.push({
        name: 'decision_consistency',
        value: decisionConsistency,
        weight: 0.1,
        description: 'Consistency of decisions with anchor'
      });

      return features;
    });

    // Availability Bias Feature Extractor
    this.featureExtractors.set('availability_bias', (data: Record<string, unknown>) => {
      const features: BiasFeature[] = [];
      
      // Recent examples
      const recentExamples = (data.recentExamples as number) || 0;
      features.push({
        name: 'recent_examples',
        value: Math.min(1, recentExamples / 10),
        weight: 0.3,
        description: 'Reliance on recent examples'
      });

      // Vivid examples
      const vividExamples = (data.vividExamples as number) || 0;
      features.push({
        name: 'vivid_examples',
        value: Math.min(1, vividExamples / 5),
        weight: 0.3,
        description: 'Reliance on vivid or memorable examples'
      });

      // Statistical evidence
      const statisticalEvidence = (data.statisticalEvidence as number) || 0;
      features.push({
        name: 'statistical_evidence',
        value: Math.min(1, statisticalEvidence / 3),
        weight: 0.25,
        description: 'Use of statistical evidence'
      });

      // Personal experience
      const personalExperience = (data.personalExperience as number) || 0;
      features.push({
        name: 'personal_experience',
        value: Math.min(1, personalExperience / 3),
        weight: 0.15,
        description: 'Reliance on personal experience'
      });

      return features;
    });

    // Groupthink Feature Extractor
    this.featureExtractors.set('groupthink', (data: Record<string, unknown>) => {
      const features: BiasFeature[] = [];
      
      // Consensus pressure
      const consensusPressure = (data.consensusPressure as number) || 0;
      features.push({
        name: 'consensus_pressure',
        value: consensusPressure,
        weight: 0.3,
        description: 'Pressure to reach consensus'
      });

      // Dissent absence
      const dissentAbsence = (data.dissentAbsence as number) || 0;
      features.push({
        name: 'dissent_absence',
        value: dissentAbsence,
        weight: 0.3,
        description: 'Absence of dissenting opinions'
      });

      // Group cohesion
      const groupCohesion = (data.groupCohesion as number) || 0;
      features.push({
        name: 'group_cohesion',
        value: groupCohesion,
        weight: 0.2,
        description: 'Level of group cohesion'
      });

      // External criticism
      const externalCriticism = (data.externalCriticism as number) || 0;
      features.push({
        name: 'external_criticism',
        value: Math.max(0, 1 - externalCriticism),
        weight: 0.2,
        description: 'Lack of external criticism'
      });

      return features;
    });
  }

  /**
   * Predict bias using a specific model
   */
  predictBias(modelId: string, data: Record<string, unknown>): BiasPrediction {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model '${modelId}' not found`);
    }

    const featureExtractor = this.featureExtractors.get(modelId);
    if (!featureExtractor) {
      throw new Error(`Feature extractor for model '${modelId}' not found`);
    }

    const features = featureExtractor(data);
    
    // Simple weighted scoring (in a real implementation, this would use a trained ML model)
    const weightedScore = features.reduce((sum, feature) => {
      return sum + (feature.value * feature.weight);
    }, 0);

    // Determine bias type and confidence
    const biasType = this.determineBiasType(modelId, weightedScore);
    const confidence = Math.min(0.95, Math.max(0.1, weightedScore * model.accuracy));
    const severity = this.determineSeverity(weightedScore);

    return {
      biasType,
      confidence,
      severity,
      features,
      explanation: this.generateExplanation(biasType, features, weightedScore),
      recommendations: this.generateRecommendations(biasType)
    };
  }

  /**
   * Predict multiple biases
   */
  predictMultipleBiases(data: Record<string, unknown>): BiasPrediction[] {
    const predictions: BiasPrediction[] = [];
    
    for (const [modelId] of this.models) {
      try {
        const prediction = this.predictBias(modelId, data);
        if (prediction.confidence > 0.3) { // Only include predictions with reasonable confidence
          predictions.push(prediction);
        }
      } catch (error) {
        console.warn(`Failed to predict bias for model ${modelId}:`, error);
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get available models
   */
  getModels(): BiasModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Train a model (placeholder for future ML implementation)
   */
  async trainModel(modelId: string, trainingData: Record<string, unknown>[]): Promise<{ success: boolean; accuracy: number }> {
    // This is a placeholder for future ML training implementation
    // In a real implementation, this would:
    // 1. Preprocess training data
    // 2. Train the ML model
    // 3. Validate the model
    // 4. Update model accuracy
    
    console.log(`Training model ${modelId} with ${trainingData.length} samples`);
    
    // Simulate training
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const model = this.models.get(modelId);
    if (model) {
      model.accuracy = Math.min(0.95, model.accuracy + 0.05);
      model.lastTrained = new Date();
    }
    
    return {
      success: true,
      accuracy: model?.accuracy || 0.8
    };
  }

  // Private helper methods
  private determineBiasType(modelId: string, score: number): string {
    const model = this.models.get(modelId);
    if (!model) return 'unknown';
    
    if (score > 0.7) {
      return model.biasTypes[0]; // Primary bias type
    } else if (score > 0.5) {
      return model.biasTypes[1] || model.biasTypes[0]; // Secondary bias type
    } else {
      return model.biasTypes[2] || model.biasTypes[0]; // Tertiary bias type
    }
  }

  private determineSeverity(score: number): 'low' | 'medium' | 'high' {
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  private generateExplanation(biasType: string, features: BiasFeature[], score: number): string {
    const topFeatures = features
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
    
    const explanations: Record<string, string> = {
      'confirmation_bias': `Strong evidence of confirmation bias detected. The analysis shows ${topFeatures.map(f => f.description).join(' and ')}. This suggests a tendency to favor information that confirms existing beliefs.`,
      'anchoring_bias': `Anchoring bias identified. The decision-making process shows ${topFeatures.map(f => f.description).join(' and ')}. This indicates over-reliance on initial information or first impressions.`,
      'availability_bias': `Availability bias detected. The analysis reveals ${topFeatures.map(f => f.description).join(' and ')}. This suggests over-reliance on easily recalled or recent information.`,
      'groupthink': `Groupthink patterns identified. The group dynamics show ${topFeatures.map(f => f.description).join(' and ')}. This indicates pressure for consensus and lack of critical evaluation.`
    };

    return explanations[biasType] || `Bias pattern detected with confidence ${(score * 100).toFixed(1)}%.`;
  }

  private generateRecommendations(biasType: string): string[] {
    const recommendations: Record<string, string[]> = {
      'confirmation_bias': [
        'Actively seek out contradictory evidence',
        'Consider alternative explanations',
        'Use structured decision-making frameworks',
        'Encourage devil\'s advocate perspectives'
      ],
      'anchoring_bias': [
        'Consider multiple reference points',
        'Use range-based estimates',
        'Delay initial judgments',
        'Seek diverse perspectives'
      ],
      'availability_bias': [
        'Use statistical data over anecdotes',
        'Consider base rates and probabilities',
        'Seek comprehensive information',
        'Avoid over-reliance on recent events'
      ],
      'groupthink': [
        'Encourage dissenting opinions',
        'Use anonymous feedback mechanisms',
        'Bring in external experts',
        'Assign devil\'s advocate roles'
      ]
    };

    return recommendations[biasType] || [
      'Consider multiple perspectives',
      'Use structured decision-making processes',
      'Seek diverse information sources',
      'Apply critical thinking techniques'
    ];
  }
}

// Singleton instance
export const mlBiasService = new MLBiasService();
