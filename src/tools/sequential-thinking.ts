import { v4 as uuidv4 } from 'uuid';
import type {
  ThinkingSession,
  Thought,
  ProgressAnalysis,
  Branch,
  StartThinkingParams,
  AddThoughtParams,
  ReviseThoughtParams,
  BranchFromThoughtParams,
  AnalyzeProgressParams,
  ConcludeThinkingParams,
  ToolResponse,
  ValidationResult
} from '../types/index.js';
import { getDatabase } from '../services/database.js';
import { sessionCache } from '../services/cache.js';
import { performanceMonitor } from '../services/performance.js';

export class SequentialThinkingTool {
  private sessions: Map<string, ThinkingSession> = new Map();
  private branches: Map<string, Branch> = new Map();
  private db = getDatabase();

  /**
   * Start a new thinking session
   */
  public async startThinking(params: StartThinkingParams): Promise<ToolResponse<ThinkingSession>> {
    try {
      const validation = this.validateStartThinking(params);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const sessionId = uuidv4();
      const now = new Date();

      const session: ThinkingSession = {
        id: sessionId,
        problem: params.problem,
        thoughts: [],
        branches: [],
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      this.sessions.set(sessionId, session);
      
      // Save to database
      await this.saveSessionToDatabase(session);

      return {
        success: true,
        data: session,
        metadata: {
          message: 'Thinking session started successfully',
          maxThoughts: params.maxThoughts || 50
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start thinking session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add a thought to an existing session
   */
  public addThought(params: AddThoughtParams): ToolResponse<Thought> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Thinking session not found'
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Cannot add thoughts to inactive session'
        };
      }

      const thoughtId = uuidv4();
      const now = new Date();

      const thought: Thought = {
        id: thoughtId,
        content: params.thought,
        timestamp: now,
        parentId: params.parentId,
        branchId: params.branchId,
        metadata: {
          sessionId: params.sessionId,
          thoughtNumber: session.thoughts.length + 1
        }
      };

      session.thoughts.push(thought);
      session.updatedAt = now;

      this.sessions.set(params.sessionId, session);

      return {
        success: true,
        data: thought,
        metadata: {
          message: 'Thought added successfully',
          totalThoughts: session.thoughts.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add thought: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Revise an existing thought
   */
  public reviseThought(params: ReviseThoughtParams): ToolResponse<Thought> {
    try {
      let foundThought: Thought | undefined;
      let sessionId: string | undefined;

      // Find the thought across all sessions
      for (const [id, session] of this.sessions) {
        const thought = session.thoughts.find(t => t.id === params.thoughtId);
        if (thought) {
          foundThought = thought;
          sessionId = id;
          break;
        }
      }

      if (!foundThought || !sessionId) {
        return {
          success: false,
          error: 'Thought not found'
        };
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }
      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Cannot revise thoughts in inactive session'
        };
      }

      // Update the thought
      foundThought.content = params.newThought;
      foundThought.metadata = {
        ...foundThought.metadata,
        revised: true,
        revisionReason: params.reason,
        revisionTimestamp: new Date()
      };

      session.updatedAt = new Date();
      this.sessions.set(sessionId, session);

      return {
        success: true,
        data: foundThought,
        metadata: {
          message: 'Thought revised successfully',
          reason: params.reason
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to revise thought: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a branch from an existing thought
   */
  public branchFromThought(params: BranchFromThoughtParams): ToolResponse<Branch> {
    try {
      let foundThought: Thought | undefined;
      let sessionId: string | undefined;

      // Find the thought across all sessions
      for (const [id, session] of this.sessions) {
        const thought = session.thoughts.find(t => t.id === params.thoughtId);
        if (thought) {
          foundThought = thought;
          sessionId = id;
          break;
        }
      }

      if (!foundThought || !sessionId) {
        return {
          success: false,
          error: 'Thought not found'
        };
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }
      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Cannot create branches in inactive session'
        };
      }

      const branchId = uuidv4();
      const now = new Date();

      const branch: Branch = {
        id: branchId,
        fromThoughtId: params.thoughtId,
        description: params.description || params.newDirection,
        thoughts: [],
        createdAt: now
      };

      this.branches.set(branchId, branch);
      session.branches.push(branchId);
      session.updatedAt = now;

      this.sessions.set(sessionId, session);

      return {
        success: true,
        data: branch,
        metadata: {
          message: 'Branch created successfully',
          fromThought: foundThought.content.substring(0, 100) + '...'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analyze progress of a thinking session
   */
  public analyzeProgress(params: AnalyzeProgressParams): ToolResponse<ProgressAnalysis> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Thinking session not found'
        };
      }

      const totalThoughts = session.thoughts.length;
      const activeBranches = session.branches.length;
      const averageThoughtLength = totalThoughts > 0 
        ? session.thoughts.reduce((sum, thought) => sum + thought.content.length, 0) / totalThoughts
        : 0;

      // Extract key insights (simplified - in real implementation, use NLP)
      const keyInsights = this.extractKeyInsights(session.thoughts);
      const nextSteps = this.generateNextSteps(session, params.includeBranches);
      
      // Calculate confidence based on thought depth and coherence
      const confidence = this.calculateConfidence(session);

      const analysis: ProgressAnalysis = {
        sessionId: params.sessionId,
        totalThoughts,
        activeBranches,
        averageThoughtLength,
        keyInsights,
        nextSteps,
        confidence
      };

      return {
        success: true,
        data: analysis,
        metadata: {
          message: 'Progress analysis completed',
          sessionStatus: session.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Conclude a thinking session
   */
  public concludeThinking(params: ConcludeThinkingParams): ToolResponse<ThinkingSession> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Thinking session not found'
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Session is not active'
        };
      }

      session.status = 'completed';
      session.conclusion = params.conclusion;
      session.updatedAt = new Date();

      this.sessions.set(params.sessionId, session);

      return {
        success: true,
        data: session,
        metadata: {
          message: 'Thinking session concluded successfully',
          confidence: params.confidence || 0.8,
          totalThoughts: session.thoughts.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to conclude thinking session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get a thinking session by ID
   */
  public async getSession(sessionId: string): Promise<ToolResponse<ThinkingSession>> {
    return performanceMonitor.measureAsync('getSession', async () => {
      let session = this.sessions.get(sessionId);
      
      // Check cache first
      if (!session) {
        const cachedSession = sessionCache.get(sessionId);
        if (cachedSession) {
          session = cachedSession as ThinkingSession;
          this.sessions.set(sessionId, session);
        }
      }
      
      // If not in memory or cache, try to load from database
      if (!session) {
        const loadedSession = await this.loadSessionFromDatabase(sessionId);
        if (loadedSession) {
          session = loadedSession;
          this.sessions.set(sessionId, session);
          // Cache the loaded session
          sessionCache.set(sessionId, session);
        }
      }
      
      if (!session) {
        return {
          success: false,
          error: 'Thinking session not found'
        };
      }

      return {
        success: true,
        data: session
      };
    });
  }

  /**
   * List all thinking sessions
   */
  public listSessions(): ToolResponse<ThinkingSession[]> {
    const sessions = Array.from(this.sessions.values());
    return {
      success: true,
      data: sessions,
      metadata: {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'active').length
      }
    };
  }

  // Private helper methods
  private async saveSessionToDatabase(session: ThinkingSession): Promise<void> {
    try {
      await this.db.saveSession({
        id: session.id,
        type: 'thinking',
        data: JSON.stringify(session),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        status: session.status
      });
      
      // Update cache
      sessionCache.set(session.id, session);
    } catch (error) {
      console.error('Failed to save session to database:', error);
      // Don't throw - allow in-memory operation to continue
    }
  }

  private async loadSessionFromDatabase(sessionId: string): Promise<ThinkingSession | null> {
    try {
      const sessionData = await this.db.getSession(sessionId);
      if (sessionData && sessionData.type === 'thinking') {
        return JSON.parse(sessionData.data) as ThinkingSession;
      }
      return null;
    } catch (error) {
      console.error('Failed to load session from database:', error);
      return null;
    }
  }

  private validateStartThinking(params: StartThinkingParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!params.problem || params.problem.trim().length === 0) {
      errors.push('Problem description is required');
    }

    if (params.problem && params.problem.length < 10) {
      warnings.push('Problem description is quite short - consider providing more detail');
    }

    if (params.maxThoughts && (params.maxThoughts < 1 || params.maxThoughts > 1000)) {
      errors.push('Max thoughts must be between 1 and 1000');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private extractKeyInsights(thoughts: Thought[]): string[] {
    // Simplified insight extraction - in real implementation, use NLP
    const insights: string[] = [];
    const keywords = ['important', 'key', 'critical', 'insight', 'realize', 'understand'];
    
    thoughts.forEach(thought => {
      const content = thought.content.toLowerCase();
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          insights.push(thought.content.substring(0, 100) + '...');
        }
      });
    });

    return insights.slice(0, 5); // Return top 5 insights
  }

  private generateNextSteps(session: ThinkingSession, includeBranches?: boolean): string[] {
    const steps: string[] = [];
    
    if (session.thoughts.length < 5) {
      steps.push('Continue exploring the problem with more detailed thoughts');
    }
    
    if (session.branches.length === 0) {
      steps.push('Consider exploring alternative approaches or perspectives');
    }
    
    if (session.thoughts.length > 10 && !session.conclusion) {
      steps.push('Begin synthesizing insights into a conclusion');
    }
    
    if (includeBranches && session.branches.length > 0) {
      steps.push('Review and develop the existing branches further');
    }

    return steps;
  }

  private calculateConfidence(session: ThinkingSession): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on thought depth
    if (session.thoughts.length > 5) confidence += 0.1;
    if (session.thoughts.length > 10) confidence += 0.1;
    if (session.thoughts.length > 20) confidence += 0.1;
    
    // Increase confidence based on branching (exploration)
    if (session.branches.length > 0) confidence += 0.1;
    
    // Increase confidence if there's a conclusion
    if (session.conclusion) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }
}
