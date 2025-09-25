import { z } from 'zod';

// Decision Making Types
export const CriteriaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(1),
  type: z.enum(['benefit', 'cost', 'risk', 'feasibility']),
});

export const OptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  risks: z.array(z.string()),
  estimatedCost: z.number().optional(),
  estimatedTime: z.string().optional(),
});

export const ScoreSchema = z.object({
  criteriaId: z.string(),
  score: z.number().min(0).max(10),
  reasoning: z.string(),
});

export const EvaluationSchema = z.object({
  optionId: z.string(),
  scores: z.array(ScoreSchema),
  overallScore: z.number(),
  weightedScore: z.number(),
  timestamp: z.date(),
});

export const DecisionSessionSchema = z.object({
  id: z.string(),
  context: z.string(),
  criteria: z.array(CriteriaSchema),
  options: z.array(OptionSchema),
  evaluations: z.array(EvaluationSchema),
  status: z.enum(['active', 'evaluating', 'completed']),
  createdAt: z.date(),
  updatedAt: z.date(),
  recommendation: z.string().optional(),
});

export const DecisionAnalysisSchema = z.object({
  sessionId: z.string(),
  topOption: z.string(),
  confidence: z.number().min(0).max(1),
  keyFactors: z.array(z.string()),
  risks: z.array(z.string()),
  alternatives: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export const RecommendationSchema = z.object({
  sessionId: z.string(),
  recommendedOption: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  risks: z.array(z.string()),
  mitigation: z.array(z.string()),
  alternatives: z.array(z.string()),
});

// Type exports
export type Criteria = z.infer<typeof CriteriaSchema>;
export type Option = z.infer<typeof OptionSchema>;
export type Score = z.infer<typeof ScoreSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;
export type DecisionSession = z.infer<typeof DecisionSessionSchema>;
export type DecisionAnalysis = z.infer<typeof DecisionAnalysisSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;

// Decision Making Tool Parameters
export interface StartDecisionParams {
  context: string;
  description?: string;
  deadline?: string;
}

export interface AddCriteriaParams {
  sessionId: string;
  criteria: Omit<Criteria, 'id'>;
}

export interface AddOptionParams {
  sessionId: string;
  option: Omit<Option, 'id'>;
}

export interface EvaluateOptionParams {
  sessionId: string;
  optionId: string;
  scores: Omit<Score, 'criteriaId'>[];
}

export interface AnalyzeDecisionParams {
  sessionId: string;
  includeAlternatives?: boolean;
}

export interface MakeRecommendationParams {
  sessionId: string;
  minConfidence?: number;
}
