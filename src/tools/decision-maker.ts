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
  private sessions: Map<string, DecisionSession> = new Map();
  private database: DatabaseService;
  private dbInitialized: boolean = false;

  constructor() {
    this.database = new DatabaseService();
    // Give database time to initialize
    setTimeout(() => {
      this.dbInitialized = true;
    }, 1000);
  }

  private async loadSession(sessionId: string): Promise<DecisionSession | null> {
    try {
      const session = await this.database.getSession(sessionId);
      if (session && session.type === 'decision') {
        const sessionData = JSON.parse(session.data);
        // Convert date strings back to Date objects
        sessionData.createdAt = new Date(sessionData.createdAt);
        sessionData.updatedAt = new Date(sessionData.updatedAt);
        return sessionData as DecisionSession;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    return null;
  }

  private async saveSession(session: DecisionSession): Promise<void> {
    try {
      const sessionData = {
        id: session.id,
        type: 'decision' as const,
        data: JSON.stringify(session),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        status: session.status as 'active' | 'paused' | 'completed' | 'archived'
      };
      await this.database.saveSession(sessionData);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
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

      this.sessions.set(sessionId, session);
      
      // Save to database synchronously
      await this.saveSession(session);

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
  public async addCriteria(params: { sessionId: string; name: string; description: string; weight: number; type: Criteria['type'] }): Promise<ToolResponse<Criteria>> {
    try {
      let session = this.sessions.get(params.sessionId);
      if (!session) {
        const loadedSession = await this.loadSession(params.sessionId);
        if (!loadedSession) {
          return {
            success: false,
            error: 'Decision session not found'
          };
        }
        session = loadedSession;
        this.sessions.set(params.sessionId, session);
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Cannot add criteria to inactive session'
        };
      }

      // Create criteria object from flat parameters
      const criteriaData = {
        name: params.name,
        description: params.description,
        weight: params.weight,
        type: params.type
      };
      
      const validation = this.validateCriteria(criteriaData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const criteriaId = uuidv4();
      const criteria: Criteria = {
        id: criteriaId,
        ...criteriaData
      };

      session.criteria.push(criteria);
      session.updatedAt = new Date();

      this.sessions.set(params.sessionId, session);
      
      // Save to database synchronously
      await this.saveSession(session);

      return {
        success: true,
        data: criteria,
        metadata: {
          message: 'Criteria added successfully',
          totalCriteria: session.criteria.length
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
      let session = this.sessions.get(params.sessionId);
      if (!session) {
        const loadedSession = await this.loadSession(params.sessionId);
        if (!loadedSession) {
          return {
            success: false,
            error: 'Decision session not found'
          };
        }
        session = loadedSession;
        this.sessions.set(params.sessionId, session);
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Cannot add options to inactive session'
        };
      }

      // Create option object from flat parameters
      const optionData = {
        name: params.name,
        description: params.description,
        pros: params.pros,
        cons: params.cons,
        risks: params.risks,
        estimatedCost: params.estimatedCost,
        estimatedTime: params.estimatedTime
      };

      const validation = this.validateOption(optionData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const optionId = uuidv4();
      const option: Option = {
        id: optionId,
        ...optionData
      };

      session.options.push(option);
      session.updatedAt = new Date();

      this.sessions.set(params.sessionId, session);
      
      // Save to database synchronously
      await this.saveSession(session);

      return {
        success: true,
        data: option,
        metadata: {
          message: 'Option added successfully',
          totalOptions: session.options.length
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
      let session = this.sessions.get(params.sessionId);
      if (!session) {
        const loadedSession = await this.loadSession(params.sessionId);
        if (!loadedSession) {
          return {
            success: false,
            error: 'Decision session not found'
          };
        }
        session = loadedSession;
        this.sessions.set(params.sessionId, session);
      }

      const option = session.options.find(o => o.id === params.optionId);
      if (!option) {
        return {
          success: false,
          error: 'Option not found'
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Cannot evaluate options in inactive session'
        };
      }

      const validation = this.validateEvaluation(params.scores, session.criteria);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Calculate overall and weighted scores
      const overallScore = params.scores.reduce((sum, score) => sum + score.score, 0) / params.scores.length;
      const weightedScore = this.calculateWeightedScore(params.scores, session.criteria);

      const evaluation: Evaluation = {
        optionId: params.optionId,
        scores: params.scores.map((score, index) => ({
          criteriaId: session.criteria[index]?.id || '',
          score: score.score,
          reasoning: score.reasoning
        })),
        overallScore,
        weightedScore,
        timestamp: new Date()
      };

      // Remove existing evaluation for this option if it exists
      session.evaluations = session.evaluations.filter(e => e.optionId !== params.optionId);
      session.evaluations.push(evaluation);
      session.updatedAt = new Date();

      this.sessions.set(params.sessionId, session);
      
      // Save to database synchronously
      await this.saveSession(session);

      return {
        success: true,
        data: evaluation,
        metadata: {
          message: 'Option evaluated successfully',
          overallScore,
          weightedScore
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
   * Analyze the decision session
   */
  public async analyzeDecision(params: AnalyzeDecisionParams): Promise<ToolResponse<DecisionAnalysis>> {
    try {
      let session = this.sessions.get(params.sessionId);
      if (!session) {
        const loadedSession = await this.loadSession(params.sessionId);
        if (!loadedSession) {
          return {
            success: false,
            error: 'Decision session not found'
          };
        }
        session = loadedSession;
        this.sessions.set(params.sessionId, session);
      }

      if (session.evaluations.length === 0) {
        return {
          success: false,
          error: 'No evaluations found - please evaluate options first'
        };
      }

      // Find the top option
      const topEvaluation = session.evaluations.reduce((prev, current) => 
        current.weightedScore > prev.weightedScore ? current : prev
      );
      const topOption = session.options.find(o => o.id === topEvaluation.optionId);

      if (!topOption) {
        return {
          success: false,
          error: 'Top option not found'
        };
      }

      // Calculate confidence based on score distribution
      const confidence = this.calculateConfidence(session.evaluations);
      
      // Extract key factors
      const keyFactors = this.extractKeyFactors(session, topEvaluation);
      
      // Identify risks
      const risks = this.identifyRisks(session, topOption);
      
      // Generate alternatives if requested
      const alternatives = params.includeAlternatives 
        ? this.generateAlternatives(session)
        : [];
      
      // Generate next steps
      const nextSteps = this.generateNextSteps(session, topOption);

      const analysis: DecisionAnalysis = {
        sessionId: params.sessionId,
        topOption: topOption.name,
        confidence,
        keyFactors,
        risks,
        alternatives,
        nextSteps
      };

      return {
        success: true,
        data: analysis,
        metadata: {
          message: 'Decision analysis completed',
          topScore: topEvaluation.weightedScore,
          totalEvaluations: session.evaluations.length
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
   * Make a recommendation
   */
  public async makeRecommendation(params: MakeRecommendationParams): Promise<ToolResponse<Recommendation>> {
    try {
      let session = this.sessions.get(params.sessionId);
      if (!session) {
        const loadedSession = await this.loadSession(params.sessionId);
        if (!loadedSession) {
          return {
            success: false,
            error: 'Decision session not found'
          };
        }
        session = loadedSession;
        this.sessions.set(params.sessionId, session);
      }

      const analysisResult = await this.analyzeDecision({ 
        sessionId: params.sessionId, 
        includeAlternatives: true 
      });

      if (!analysisResult.success || !analysisResult.data) {
        return {
          success: false,
          error: 'Failed to analyze decision for recommendation'
        };
      }

      const analysis = analysisResult.data;
      const topOption = session.options.find(o => o.name === analysis.topOption);

      if (!topOption) {
        return {
          success: false,
          error: 'Top option not found'
        };
      }

      if (analysis.confidence < (params.minConfidence || 0.3)) {
        return {
          success: false,
          error: `Confidence level (${analysis.confidence}) is below minimum threshold (${params.minConfidence || 0.3})`
        };
      }

      const reasoning = this.generateReasoning(session, topOption, analysis);
      const mitigation = this.generateMitigation(analysis.risks);

      const recommendation: Recommendation = {
        sessionId: params.sessionId,
        recommendedOption: topOption.name,
        reasoning,
        confidence: analysis.confidence,
        risks: analysis.risks,
        mitigation,
        alternatives: analysis.alternatives
      };

      // Update session status
      session.status = 'completed';
      session.recommendation = recommendation.recommendedOption;
      session.updatedAt = new Date();
      this.sessions.set(params.sessionId, session);

      return {
        success: true,
        data: recommendation,
        metadata: {
          message: 'Recommendation generated successfully',
          confidence: analysis.confidence
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
   * Get a decision session by ID
   */
  public async getSession(sessionId: string): Promise<ToolResponse<DecisionSession>> {
    try {
      let session = this.sessions.get(sessionId);
      if (!session) {
        const loadedSession = await this.loadSession(sessionId);
        if (!loadedSession) {
          return {
            success: false,
            error: 'Decision session not found'
          };
        }
        session = loadedSession;
        this.sessions.set(sessionId, session);
      }

      return {
        success: true,
        data: session
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
      const dbSessions = await this.database.getAllSessions('decision');
      const sessions = dbSessions.map(s => JSON.parse(s.data) as DecisionSession);
      
      return {
        success: true,
        data: sessions,
        metadata: {
          totalSessions: sessions.length,
          activeSessions: sessions.filter(s => s.status === 'active').length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods
  private validateStartDecision(params: StartDecisionParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!params.context || params.context.trim().length === 0) {
      errors.push('Decision context is required');
    }

    if (params.context && params.context.length < 10) {
      warnings.push('Decision context is quite short - consider providing more detail');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateCriteria(criteria: Omit<Criteria, 'id'>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!criteria.name || criteria.name.trim().length === 0) {
      errors.push('Criteria name is required');
    }

    if (!criteria.description || criteria.description.trim().length === 0) {
      errors.push('Criteria description is required');
    }

    if (criteria.weight < 0 || criteria.weight > 1) {
      errors.push('Criteria weight must be between 0 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateOption(option: Omit<Option, 'id'>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!option.name || option.name.trim().length === 0) {
      errors.push('Option name is required');
    }

    if (!option.description || option.description.trim().length === 0) {
      errors.push('Option description is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateEvaluation(scores: Omit<{ criteriaId?: string; score: number; reasoning: string }, 'criteriaId'>[], criteria: Criteria[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (scores.length !== criteria.length) {
      errors.push(`Expected ${criteria.length} scores, got ${scores.length}`);
    }

    scores.forEach((score, index) => {
      if (score.score < 0 || score.score > 10) {
        errors.push(`Score ${index + 1} must be between 0 and 10`);
      }
      if (!score.reasoning || score.reasoning.trim().length === 0) {
        warnings.push(`Score ${index + 1} lacks reasoning`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private calculateWeightedScore(scores: Omit<{ criteriaId?: string; score: number; reasoning: string }, 'criteriaId'>[], criteria: Criteria[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    scores.forEach((score, index) => {
      if (index < criteria.length) {
        const weight = criteria[index].weight;
        weightedSum += score.score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(evaluations: Evaluation[]): number {
    if (evaluations.length < 2) return 0.5;

    const scores = evaluations.map(e => e.weightedScore);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher confidence when scores are more consistent (lower standard deviation)
    const consistency = Math.max(0, 1 - (standardDeviation / 5)); // Normalize to 0-1 range
    
    // Higher confidence when top score is significantly higher than others
    const sortedScores = scores.sort((a, b) => b - a);
    const topScore = sortedScores[0];
    const secondScore = sortedScores[1] || topScore;
    const separation = (topScore - secondScore) / 10; // Normalize to 0-1 range

    return Math.min(1, (consistency + separation) / 2);
  }

  private extractKeyFactors(session: DecisionSession, topEvaluation: Evaluation): string[] {
    const factors: string[] = [];
    
    topEvaluation.scores.forEach(score => {
      const criteria = session.criteria.find(c => c.id === score.criteriaId);
      if (criteria && score.score >= 8) {
        factors.push(`${criteria.name}: ${score.reasoning}`);
      }
    });

    return factors.slice(0, 3); // Return top 3 factors
  }

  private identifyRisks(session: DecisionSession, option: Option): string[] {
    const risks: string[] = [];
    
    // Add risks from option definition
    risks.push(...option.risks);
    
    // Add risks based on low scores
    const evaluation = session.evaluations.find(e => e.optionId === option.id);
    if (evaluation) {
      evaluation.scores.forEach(score => {
        if (score.score <= 3) {
          const criteria = session.criteria.find(c => c.id === score.criteriaId);
          if (criteria) {
            risks.push(`Low performance on ${criteria.name}: ${score.reasoning}`);
          }
        }
      });
    }

    return risks.slice(0, 5); // Return top 5 risks
  }

  private generateAlternatives(session: DecisionSession): string[] {
    const alternatives: string[] = [];
    
    // Suggest other options that scored well
    const sortedEvaluations = session.evaluations
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(1, 3); // Get 2nd and 3rd best options

    sortedEvaluations.forEach(evaluation => {
      const option = session.options.find(o => o.id === evaluation.optionId);
      if (option && evaluation.weightedScore > 6) {
        alternatives.push(`${option.name} (Score: ${evaluation.weightedScore.toFixed(1)})`);
      }
    });

    return alternatives;
  }

  private generateNextSteps(_session: DecisionSession, topOption: Option): string[] {
    const steps: string[] = [];
    
    steps.push(`Implement ${topOption.name}`);
    
    if (topOption.estimatedTime) {
      steps.push(`Timeline: ${topOption.estimatedTime}`);
    }
    
    if (topOption.estimatedCost) {
      steps.push(`Budget: $${topOption.estimatedCost}`);
    }
    
    steps.push('Monitor progress and adjust as needed');
    steps.push('Review decision after implementation');

    return steps;
  }

  private generateReasoning(session: DecisionSession, topOption: Option, analysis: DecisionAnalysis): string {
    const evaluation = session.evaluations.find(e => e.optionId === topOption.id);
    if (!evaluation) return 'No evaluation data available';

    let reasoning = `${topOption.name} scored highest with a weighted score of ${evaluation.weightedScore.toFixed(1)}. `;
    
    if (analysis.keyFactors.length > 0) {
      reasoning += `Key strengths include: ${analysis.keyFactors.join(', ')}. `;
    }
    
    if (analysis.confidence > 0.8) {
      reasoning += 'The decision has high confidence due to clear score separation. ';
    } else if (analysis.confidence > 0.6) {
      reasoning += 'The decision has moderate confidence. ';
    } else {
      reasoning += 'The decision has lower confidence - consider gathering more information. ';
    }

    return reasoning;
  }

  private generateMitigation(risks: string[]): string[] {
    const mitigation: string[] = [];
    
    risks.forEach(risk => {
      if (risk.includes('Low performance')) {
        mitigation.push('Develop improvement plan for identified weaknesses');
      } else if (risk.includes('cost') || risk.includes('budget')) {
        mitigation.push('Create detailed budget monitoring system');
      } else if (risk.includes('time') || risk.includes('schedule')) {
        mitigation.push('Implement project timeline tracking');
      } else {
        mitigation.push('Develop contingency plan for identified risks');
      }
    });

    return mitigation.slice(0, 3); // Return top 3 mitigation strategies
  }
}
