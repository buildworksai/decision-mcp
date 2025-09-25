import { z } from 'zod';

// Sequential Thinking Types
export const ThoughtSchema = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.date(),
  parentId: z.string().optional(),
  branchId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const ThinkingSessionSchema = z.object({
  id: z.string(),
  problem: z.string(),
  thoughts: z.array(ThoughtSchema),
  branches: z.array(z.string()),
  status: z.enum(['active', 'paused', 'completed']),
  createdAt: z.date(),
  updatedAt: z.date(),
  conclusion: z.string().optional(),
});

export const ProgressAnalysisSchema = z.object({
  sessionId: z.string(),
  totalThoughts: z.number(),
  activeBranches: z.number(),
  averageThoughtLength: z.number(),
  keyInsights: z.array(z.string()),
  nextSteps: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const BranchSchema = z.object({
  id: z.string(),
  fromThoughtId: z.string(),
  description: z.string(),
  thoughts: z.array(ThoughtSchema),
  createdAt: z.date(),
});

// Type exports
export type Thought = z.infer<typeof ThoughtSchema>;
export type ThinkingSession = z.infer<typeof ThinkingSessionSchema>;
export type ProgressAnalysis = z.infer<typeof ProgressAnalysisSchema>;
export type Branch = z.infer<typeof BranchSchema>;

// Sequential Thinking Tool Parameters
export interface StartThinkingParams {
  problem: string;
  context?: string;
  maxThoughts?: number;
}

export interface AddThoughtParams {
  sessionId: string;
  thought: string;
  parentId?: string;
  branchId?: string;
}

export interface ReviseThoughtParams {
  thoughtId: string;
  newThought: string;
  reason?: string;
}

export interface BranchFromThoughtParams {
  thoughtId: string;
  newDirection: string;
  description?: string;
}

export interface AnalyzeProgressParams {
  sessionId: string;
  includeBranches?: boolean;
}

export interface ConcludeThinkingParams {
  sessionId: string;
  conclusion: string;
  confidence?: number;
}
