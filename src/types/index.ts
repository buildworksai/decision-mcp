// Export all types from a central location
export * from './thinking-types.js';
export * from './decision-types.js';
export * from './analyzer-types.js';

// Common utility types
export interface SessionState {
  id: string;
  type: 'thinking' | 'decision' | 'analysis';
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
