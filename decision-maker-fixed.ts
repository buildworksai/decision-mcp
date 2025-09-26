import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../services/database.js';
import type {
  DecisionSession,
  Criteria,
  Option,
  Evaluation,
  DecisionAnalysis,
  Recommendation,
  StartDecisionParams,
  EvaluateOptionParams,
  AnalyzeDecisionParams,
  MakeRecommendationParams,
  ToolResponse,
  ValidationResult
} from '../types/index.js';

export class DecisionMakerTool {
  private database: DatabaseService;

  constructor() {
    this.database = new DatabaseService();
  }

  /**
   * Start a new decision session
   */
  public async startDecision(params: StartDecisionParams): Promise<ToolResponse<DecisionSession>> {
    try {
      const validation = this.validateStartDecision(params);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const sessionId = uuidv4();
      const now = new Date();

      const session: DecisionSession = {
        id: sessionId,
        context: params.context,
        criteria: [],
        options: [],
        evaluations: [],
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      await this.database.saveSession(sessionId, 'decision', session);

      return {
        success: true,
        data: session,
        metadata: {
          message: 'Decision session started successfully',
          deadline: params.deadline
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start decision session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add criteria to a decision session
   */
  public async addCriteria(params: { sessionId: string; name: string; description: string; weight: number; type: 'benefit' | 'cost' | 'risk' | 'feasibility' }): Promise<ToolResponse<Criteria>> {
    try {
      const session = await this.database.getSession(params.sessionId);
      if (!session || session.type !== 'decision') {
        return {
          success: false,
          error: 'Decision session not found'
        };
      }

      const decisionSession = session.data as DecisionSession;

      if (decisionSession.status !== 'active') {
        return {
          success: false,
          error: 'Cannot add criteria to inactive session'
        };
      }

      const criteria: Criteria = {
        id: uuidv4(),
        name: params.name,
        description: params.description,
        weight: params.weight,
        type: params.type
      };

      decisionSession.criteria.push(criteria);
      decisionSession.updatedAt = new Date();

      await this.database.saveSession(params.sessionId, 'decision', decisionSession);

      return {
        success: true,
        data: criteria,
        metadata: {
          message: 'Criteria added successfully',
          totalCriteria: decisionSession.criteria.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add criteria: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add an option to a decision session
   */
  public async addOption(params: { sessionId: string; name: string; description: string; pros: string[]; cons: string[]; risks: string[]; estimatedCost?: number; estimatedTime?: string }): Promise<ToolResponse<Option>> {
    try {
      const session = await this.database.getSession(params.sessionId);
      if (!session || session.type !== 'decision') {
        return {
          success: false,
          error: 'Decision session not found'
        };
      }

      const decisionSession = session.data as DecisionSession;

      if (decisionSession.status !== 'active') {
        return {
          success: false,
          error: 'Cannot add options to inactive session'
        };
      }

      const option: Option = {
        id: uuidv4(),
        name: params.name,
        description: params.description,
        pros: params.pros,
        cons: params.cons,
        risks: params.risks,
        estimatedCost: params.estimatedCost,
        estimatedTime: params.estimatedTime
      };

      decisionSession.options.push(option);
      decisionSession.updatedAt = new Date();

      await this.database.saveSession(params.sessionId, 'decision', decisionSession);

      return {
        success: true,
        data: option,
        metadata: {
          message: 'Option added successfully',
          totalOptions: decisionSession.options.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add option: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Evaluate an option against criteria
   */
  public async evaluateOption(params: EvaluateOptionParams): Promise<ToolResponse<Evaluation>> {
    try {
      const session = await this.database.getSession(params.sessionId);
      if (!session || session.type !== 'decision') {
        return {
          success: false,
          error: 'Decision session not found'
        };
      }

      const decisionSession = session.data as DecisionSession;

      const option = decisionSession.options.find(o => o.id === params.optionId);
      if (!option) {
        return {
          success: false,
          error: 'Option not found'
        };
      }

      if (decisionSession.status !== 'active') {
        return {
          success: false,
          error: 'Cannot evaluate options in inactive session'
        };
      }

      const validation = this.validateEvaluation(params.scores, decisionSession.criteria);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Calculate overall and weighted scores
      const overallScore = params.scores.reduce((sum, score) => sum + score.score, 0) / params.scores.length;
      const weightedScore = this.calculateWeightedScore(params.scores, decisionSession.criteria);

      const evaluation: Evaluation = {
        optionId: params.optionId,
        scores: params.scores.map((score, index) => ({
          criteriaId: decisionSession.criteria[index]?.id || '',
          score: score.score,
          reasoning: score.reasoning
        })),
        overallScore,
        weightedScore,
        timestamp: new Date()
      };

      // Remove existing evaluation for this option if it exists
      decisionSession.evaluations = decisionSession.evaluations.filter(e => e.optionId !== params.optionId);
      decisionSession.evaluations.push(evaluation);
      decisionSession.updatedAt = new Date();

      await this.database.saveSession(params.sessionId, 'decision', decisionSession);

      return {
        success: true,
        data: evaluation,
        metadata: {
          message: 'Option evaluated successfully',
          totalEvaluations: decisionSession.evaluations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to evaluate option: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analyze a decision session
   */
  public async analyzeDecision(params: AnalyzeDecisionParams): Promise<ToolResponse<DecisionAnalysis>> {
    try {
      const session = await this.database.getSession(params.sessionId);
      if (!session || session.type !== 'decision') {
        return {
          success: false,
          error: 'Decision session not found'
        };
      }

      const decisionSession = session.data as DecisionSession;

      if (decisionSession.options.length === 0) {
        return {
          success: false,
          error: 'No options available for analysis'
        };
      }

      if (decisionSession.evaluations.length === 0) {
        return {
          success: false,
          error: 'No evaluations available for analysis. Please evaluate options first.'
        };
      }

      const analysis: DecisionAnalysis = {
        sessionId: params.sessionId,
        summary: this.generateAnalysisSummary(decisionSession),
        topOptions: this.getTopOptions(decisionSession),
        insights: this.generateInsights(decisionSession),
        recommendations: params.includeAlternatives ? this.generateAlternatives(decisionSession) : [],
        timestamp: new Date()
      };

      return {
        success: true,
        data: analysis,
        metadata: {
          message: 'Decision analysis completed successfully',
          totalOptions: decisionSession.options.length,
          totalEvaluations: decisionSession.evaluations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Make a recommendation based on analysis
   */
  public async makeRecommendation(params: MakeRecommendationParams): Promise<ToolResponse<Recommendation>> {
    try {
      const session = await this.database.getSession(params.sessionId);
      if (!session || session.type !== 'decision') {
        return {
          success: false,
          error: 'Decision session not found'
        };
      }

      const decisionSession = session.data as DecisionSession;

      if (decisionSession.evaluations.length === 0) {
        return {
          success: false,
          error: 'No evaluations available. Please evaluate options first.'
        };
      }

      const topOption = this.getTopOptions(decisionSession)[0];
      if (!topOption) {
        return {
          success: false,
          error: 'No suitable option found for recommendation'
        };
      }

      const confidence = this.calculateConfidence(decisionSession, topOption);
      
      if (confidence < (params.minConfidence || 0.5)) {
        return {
          success: false,
          error: `Confidence level (${confidence.toFixed(2)}) is below minimum required (${params.minConfidence || 0.5})`
        };
      }

      const recommendation: Recommendation = {
        sessionId: params.sessionId,
        recommendedOption: topOption,
        confidence,
        reasoning: this.generateRecommendationReasoning(decisionSession, topOption),
        alternatives: this.getTopOptions(decisionSession).slice(1, 3),
        timestamp: new Date()
      };

      return {
        success: true,
        data: recommendation,
        metadata: {
          message: 'Recommendation generated successfully',
          confidence: confidence
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to make recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get a decision session
   */
  public async getSession(sessionId: string): Promise<ToolResponse<DecisionSession>> {
    try {
      const session = await this.database.getSession(sessionId);
      if (!session || session.type !== 'decision') {
        return {
          success: false,
          error: 'Decision session not found'
        };
      }

      return {
        success: true,
        data: session.data as DecisionSession
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List all decision sessions
   */
  public async listSessions(): Promise<ToolResponse<DecisionSession[]>> {
    try {
      const sessions = await this.database.getAllSessions('decision');
      const decisionSessions = sessions.map(s => s.data as DecisionSession);

      return {
        success: true,
        data: decisionSessions,
        metadata: {
          message: 'Decision sessions retrieved successfully',
          totalSessions: decisionSessions.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Helper methods remain the same...
  private validateStartDecision(params: StartDecisionParams): ValidationResult {
    const errors: string[] = [];

    if (!params.context || params.context.trim().length === 0) {
      errors.push('Context is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateEvaluation(scores: Array<{ score: number; reasoning: string }>, criteria: Criteria[]): ValidationResult {
    const errors: string[] = [];

    if (scores.length !== criteria.length) {
      errors.push(`Expected ${criteria.length} scores, got ${scores.length}`);
    }

    scores.forEach((score, index) => {
      if (score.score < 0 || score.score > 10) {
        errors.push(`Score for criteria ${index + 1} must be between 0 and 10`);
      }
      if (!score.reasoning || score.reasoning.trim().length === 0) {
        errors.push(`Reasoning for criteria ${index + 1} is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private calculateWeightedScore(scores: Array<{ score: number; reasoning: string }>, criteria: Criteria[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    scores.forEach((score, index) => {
      const weight = criteria[index]?.weight || 0;
      weightedSum += score.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private generateAnalysisSummary(session: DecisionSession): string {
    const totalOptions = session.options.length;
    const totalEvaluations = session.evaluations.length;
    const totalCriteria = session.criteria.length;

    return `Analysis of ${totalOptions} options against ${totalCriteria} criteria with ${totalEvaluations} evaluations completed.`;
  }

  private getTopOptions(session: DecisionSession): Option[] {
    const optionsWithScores = session.options.map(option => {
      const evaluation = session.evaluations.find(e => e.optionId === option.id);
      return {
        option,
        weightedScore: evaluation?.weightedScore || 0
      };
    });

    return optionsWithScores
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .map(item => item.option);
  }

  private generateInsights(session: DecisionSession): string[] {
    const insights: string[] = [];
    
    if (session.evaluations.length > 0) {
      const avgScore = session.evaluations.reduce((sum, e) => sum + e.weightedScore, 0) / session.evaluations.length;
      insights.push(`Average weighted score across all options: ${avgScore.toFixed(2)}`);
    }

    if (session.criteria.length > 0) {
      const highWeightCriteria = session.criteria.filter(c => c.weight > 0.3);
      if (highWeightCriteria.length > 0) {
        insights.push(`High-weight criteria: ${highWeightCriteria.map(c => c.name).join(', ')}`);
      }
    }

    return insights;
  }

  private generateAlternatives(session: DecisionSession): string[] {
    // Simple alternative generation - in a real implementation, this would be more sophisticated
    return [
      'Consider hybrid approaches combining top options',
      'Evaluate additional options not yet considered',
      'Reassess criteria weights based on new information'
    ];
  }

  private calculateConfidence(session: DecisionSession, topOption: Option): number {
    const evaluation = session.evaluations.find(e => e.optionId === topOption.id);
    if (!evaluation) return 0;

    // Simple confidence calculation based on score and number of evaluations
    const scoreConfidence = evaluation.weightedScore / 10; // Normalize to 0-1
    const evaluationConfidence = Math.min(session.evaluations.length / 3, 1); // More evaluations = higher confidence
    
    return (scoreConfidence + evaluationConfidence) / 2;
  }

  private generateRecommendationReasoning(session: DecisionSession, topOption: Option): string {
    const evaluation = session.evaluations.find(e => e.optionId === topOption.id);
    if (!evaluation) return 'No evaluation data available';

    return `Recommended based on weighted score of ${evaluation.weightedScore.toFixed(2)} out of 10, considering ${session.criteria.length} criteria.`;
  }
}
