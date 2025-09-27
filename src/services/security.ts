import { z } from 'zod';

// Input validation schemas
export const SessionIdSchema = z.string().uuid();
export const ProblemSchema = z.string().min(10).max(5000);
export const ThoughtSchema = z.string().min(1).max(2000);
export const CriteriaNameSchema = z.string().min(1).max(100);
export const CriteriaDescriptionSchema = z.string().min(1).max(500);
export const OptionNameSchema = z.string().min(1).max(100);
export const OptionDescriptionSchema = z.string().min(1).max(1000);

// Security validation functions
export class SecurityValidator {
  private static readonly MAX_SESSION_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_THOUGHTS_PER_SESSION = 1000;
  private static readonly MAX_CRITERIA_PER_SESSION = 50;
  private static readonly MAX_OPTIONS_PER_SESSION = 100;

  static validateSessionId(sessionId: string): { valid: boolean; error?: string } {
    try {
      SessionIdSchema.parse(sessionId);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Invalid session ID format' 
      };
    }
  }

  static validateProblem(problem: string): { valid: boolean; error?: string } {
    try {
      ProblemSchema.parse(problem);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Problem description must be between 10 and 5000 characters' 
      };
    }
  }

  static validateThought(thought: string): { valid: boolean; error?: string } {
    try {
      ThoughtSchema.parse(thought);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Thought must be between 1 and 2000 characters' 
      };
    }
  }

  static validateCriteriaName(name: string): { valid: boolean; error?: string } {
    try {
      CriteriaNameSchema.parse(name);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Criteria name must be between 1 and 100 characters' 
      };
    }
  }

  static validateCriteriaDescription(description: string): { valid: boolean; error?: string } {
    try {
      CriteriaDescriptionSchema.parse(description);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Criteria description must be between 1 and 500 characters' 
      };
    }
  }

  static validateOptionName(name: string): { valid: boolean; error?: string } {
    try {
      OptionNameSchema.parse(name);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Option name must be between 1 and 100 characters' 
      };
    }
  }

  static validateOptionDescription(description: string): { valid: boolean; error?: string } {
    try {
      OptionDescriptionSchema.parse(description);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: 'Option description must be between 1 and 1000 characters' 
      };
    }
  }

  static validateSessionLifetime(createdAt: Date): { valid: boolean; error?: string } {
    const now = new Date();
    const age = now.getTime() - createdAt.getTime();
    
    if (age > this.MAX_SESSION_LIFETIME) {
      return { 
        valid: false, 
        error: 'Session has expired (24 hour limit)' 
      };
    }
    
    return { valid: true };
  }

  static validateSessionLimits(session: { thoughts?: unknown[]; criteria?: unknown[]; options?: unknown[] }): { valid: boolean; error?: string } {
    if (session.thoughts && session.thoughts.length > this.MAX_THOUGHTS_PER_SESSION) {
      return { 
        valid: false, 
        error: `Too many thoughts (max ${this.MAX_THOUGHTS_PER_SESSION})` 
      };
    }

    if (session.criteria && session.criteria.length > this.MAX_CRITERIA_PER_SESSION) {
      return { 
        valid: false, 
        error: `Too many criteria (max ${this.MAX_CRITERIA_PER_SESSION})` 
      };
    }

    if (session.options && session.options.length > this.MAX_OPTIONS_PER_SESSION) {
      return { 
        valid: false, 
        error: `Too many options (max ${this.MAX_OPTIONS_PER_SESSION})` 
      };
    }

    return { valid: true };
  }

  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters and normalize whitespace
    return input
      .replace(/[<>"'&]/g, '') // Remove HTML/XML characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  static validateWeight(weight: number): { valid: boolean; error?: string } {
    if (typeof weight !== 'number' || isNaN(weight)) {
      return { valid: false, error: 'Weight must be a number' };
    }
    
    if (weight < 0 || weight > 1) {
      return { valid: false, error: 'Weight must be between 0 and 1' };
    }
    
    return { valid: true };
  }

  static validateScore(score: number): { valid: boolean; error?: string } {
    if (typeof score !== 'number' || isNaN(score)) {
      return { valid: false, error: 'Score must be a number' };
    }
    
    if (score < 0 || score > 10) {
      return { valid: false, error: 'Score must be between 0 and 10' };
    }
    
    return { valid: true };
  }
}

// Audit logging
export class AuditLogger {
  private static logs: Array<{
    timestamp: Date;
    action: string;
    sessionId?: string;
    userId?: string;
    details: Record<string, unknown>;
  }> = [];

  static log(action: string, sessionId?: string, userId?: string, details: Record<string, unknown> = {}): void {
    const logEntry = {
      timestamp: new Date(),
      action,
      sessionId,
      userId,
      details: {
        ...details,
        userAgent: 'Decision MCP',
        version: '2.4.0'
      }
    };

    this.logs.push(logEntry);
    
    // Keep only last 1000 log entries
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // In production, you might want to send this to a logging service
    console.log(`[AUDIT] ${action}`, logEntry);
  }

  static getLogs(sessionId?: string, limit: number = 100): Array<typeof this.logs[0]> {
    let filteredLogs = this.logs;
    
    if (sessionId) {
      filteredLogs = this.logs.filter(log => log.sessionId === sessionId);
    }
    
    return filteredLogs.slice(-limit);
  }

  static clearLogs(): void {
    this.logs = [];
  }
}

// Security middleware for MCP tools
export function createSecurityMiddleware(): { validateInput: (input: string, type: 'problem' | 'thought' | 'criteria' | 'option') => string; auditAction: (action: string, sessionId?: string, details?: Record<string, unknown>) => void } {
  return {
    validateInput: (input: string, type: 'problem' | 'thought' | 'criteria' | 'option'): string => {
      const sanitized = SecurityValidator.sanitizeInput(input);
      
      let validation;
      switch (type) {
        case 'problem':
          validation = SecurityValidator.validateProblem(sanitized);
          break;
        case 'thought':
          validation = SecurityValidator.validateThought(sanitized);
          break;
        case 'criteria':
          validation = SecurityValidator.validateCriteriaName(sanitized);
          break;
        case 'option':
          validation = SecurityValidator.validateOptionName(sanitized);
          break;
        default:
          validation = { valid: false, error: 'Unknown input type' };
      }
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      return sanitized;
    },
    
    auditAction: (action: string, sessionId?: string, details?: Record<string, unknown>): void => {
      AuditLogger.log(action, sessionId, undefined, details);
    }
  };
}
