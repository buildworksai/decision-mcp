import { z } from 'zod';

// Decision Analyzer Types
export const BiasTypeSchema = z.enum([
  'confirmation',
  'anchoring',
  'availability',
  'representativeness',
  'overconfidence',
  'sunk_cost',
  'status_quo',
  'framing',
  'groupthink',
  'recency'
]);

export const BiasDetectionSchema = z.object({
  type: BiasTypeSchema,
  severity: z.number().min(0).max(1),
  description: z.string(),
  evidence: z.array(z.string()),
  mitigation: z.string(),
});

export const LogicValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  consistency: z.number().min(0).max(1),
});

export const RiskAssessmentSchema = z.object({
  level: z.enum(['low', 'medium', 'high', 'critical']),
  probability: z.number().min(0).max(1),
  impact: z.number().min(0).max(1),
  description: z.string(),
  mitigation: z.array(z.string()),
  monitoring: z.array(z.string()),
});

export const AlternativeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  feasibility: z.number().min(0).max(1),
  innovation: z.number().min(0).max(1),
});

export const BiasAnalysisSchema = z.object({
  sessionId: z.string(),
  detectedBiases: z.array(BiasDetectionSchema),
  overallBiasScore: z.number().min(0).max(1),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const ComprehensiveAnalysisSchema = z.object({
  sessionId: z.string(),
  biasAnalysis: BiasAnalysisSchema,
  logicValidation: LogicValidationSchema,
  riskAssessment: z.array(RiskAssessmentSchema),
  alternatives: z.array(AlternativeSchema),
  overallQuality: z.number().min(0).max(1),
  recommendations: z.array(z.string()),
});

// Type exports
export type BiasType = z.infer<typeof BiasTypeSchema>;
export type BiasDetection = z.infer<typeof BiasDetectionSchema>;
export type LogicValidation = z.infer<typeof LogicValidationSchema>;
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;
export type Alternative = z.infer<typeof AlternativeSchema>;
export type BiasAnalysis = z.infer<typeof BiasAnalysisSchema>;
export type ComprehensiveAnalysis = z.infer<typeof ComprehensiveAnalysisSchema>;

// Decision Analyzer Tool Parameters
export interface AnalyzeBiasParams {
  sessionId: string;
  includeMitigation?: boolean;
}

export interface ValidateLogicParams {
  sessionId: string;
  strictMode?: boolean;
}

export interface AssessRisksParams {
  sessionId: string;
  includeMitigation?: boolean;
}

export interface GenerateAlternativesParams {
  sessionId: string;
  maxAlternatives?: number;
  focusAreas?: string[];
}

export interface ComprehensiveAnalysisParams {
  sessionId: string;
  includeAll?: boolean;
}
