import { v4 as uuidv4 } from 'uuid';
import type {
  BiasAnalysis,
  LogicValidation,
  RiskAssessment,
  Alternative,
  ComprehensiveAnalysis,
  AnalyzeBiasParams,
  ValidateLogicParams,
  AssessRisksParams,
  GenerateAlternativesParams,
  ComprehensiveAnalysisParams,
  ToolResponse,
  DecisionSession,
  ThinkingSession
} from '../types/index.js';

export class DecisionAnalyzerTool {
  private sessions: Map<string, DecisionSession | ThinkingSession> = new Map();

  /**
   * Analyze bias in a decision or thinking session
   */
  public analyzeBias(params: AnalyzeBiasParams): ToolResponse<BiasAnalysis> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      const detectedBiases = this.detectBiases(session);
      const overallBiasScore = this.calculateBiasScore(detectedBiases);
      const recommendations = this.generateBiasRecommendations(detectedBiases);
      const confidence = this.calculateBiasConfidence(detectedBiases);

      const analysis: BiasAnalysis = {
        sessionId: params.sessionId,
        detectedBiases,
        overallBiasScore,
        recommendations,
        confidence
      };

      return {
        success: true,
        data: analysis,
        metadata: {
          message: 'Bias analysis completed',
          totalBiases: detectedBiases.length,
          severityLevel: this.getSeverityLevel(overallBiasScore)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze bias: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate logic in a decision session
   */
  public validateLogic(params: ValidateLogicParams): ToolResponse<LogicValidation> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (!('criteria' in session)) {
        return {
          success: false,
          error: 'Logic validation is only available for decision sessions'
        };
      }

      const decisionSession = session as DecisionSession;
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Validate criteria consistency
      this.validateCriteriaConsistency(decisionSession, errors, warnings);
      
      // Validate evaluation completeness
      this.validateEvaluationCompleteness(decisionSession, errors, warnings);
      
      // Validate score consistency
      this.validateScoreConsistency(decisionSession, errors, warnings, suggestions);
      
      // Validate option completeness
      this.validateOptionCompleteness(decisionSession, errors, warnings);

      const isValid = errors.length === 0;
      const consistency = this.calculateLogicConsistency(decisionSession, errors, warnings);

      const validation: LogicValidation = {
        isValid,
        errors,
        warnings,
        suggestions,
        consistency
      };

      return {
        success: true,
        data: validation,
        metadata: {
          message: 'Logic validation completed',
          errorCount: errors.length,
          warningCount: warnings.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate logic: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Assess risks in a decision session
   */
  public assessRisks(params: AssessRisksParams): ToolResponse<RiskAssessment[]> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (!('criteria' in session)) {
        return {
          success: false,
          error: 'Risk assessment is only available for decision sessions'
        };
      }

      const decisionSession = session as DecisionSession;
      const risks = this.identifyRisks(decisionSession, params.includeMitigation);

      return {
        success: true,
        data: risks,
        metadata: {
          message: 'Risk assessment completed',
          totalRisks: risks.length,
          criticalRisks: risks.filter(r => r.level === 'critical').length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to assess risks: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate alternatives for a decision session
   */
  public generateAlternatives(params: GenerateAlternativesParams): ToolResponse<Alternative[]> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (!('criteria' in session)) {
        return {
          success: false,
          error: 'Alternative generation is only available for decision sessions'
        };
      }

      const decisionSession = session as DecisionSession;
      const alternatives = this.createAlternatives(decisionSession, params);

      return {
        success: true,
        data: alternatives,
        metadata: {
          message: 'Alternatives generated successfully',
          totalAlternatives: alternatives.length,
          focusAreas: params.focusAreas || ['all']
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate alternatives: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Perform comprehensive analysis
   */
  public comprehensiveAnalysis(params: ComprehensiveAnalysisParams): ToolResponse<ComprehensiveAnalysis> {
    try {
      const session = this.sessions.get(params.sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      // Perform all analyses
      const biasAnalysis = this.analyzeBias({ 
        sessionId: params.sessionId, 
        includeMitigation: params.includeAll 
      });

      let logicValidation: LogicValidation | undefined;
      let riskAssessment: RiskAssessment[] = [];
      let alternatives: Alternative[] = [];

      if ('criteria' in session) {
        logicValidation = this.validateLogic({ 
          sessionId: params.sessionId, 
          strictMode: params.includeAll 
        }).data;

        riskAssessment = this.assessRisks({ 
          sessionId: params.sessionId, 
          includeMitigation: params.includeAll 
        }).data || [];

        alternatives = this.generateAlternatives({ 
          sessionId: params.sessionId, 
          maxAlternatives: 5, 
          focusAreas: params.includeAll ? undefined : ['innovation', 'feasibility'] 
        }).data || [];
      }

      const overallQuality = this.calculateOverallQuality(
        biasAnalysis.data,
        logicValidation,
        riskAssessment
      );

      const recommendations = this.generateComprehensiveRecommendations(
        biasAnalysis.data,
        logicValidation,
        riskAssessment,
        alternatives
      );

      const analysis: ComprehensiveAnalysis = {
        sessionId: params.sessionId,
        biasAnalysis: biasAnalysis.data || {
          sessionId: params.sessionId,
          detectedBiases: [],
          overallBiasScore: 0,
          recommendations: [],
          confidence: 0
        },
        logicValidation: logicValidation || {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: [],
          consistency: 1.0
        },
        riskAssessment,
        alternatives,
        overallQuality,
        recommendations
      };

      return {
        success: true,
        data: analysis,
        metadata: {
          message: 'Comprehensive analysis completed',
          overallQuality,
          recommendationCount: recommendations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to perform comprehensive analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Set session data for analysis
   */
  public setSession(session: DecisionSession | ThinkingSession): void {
    this.sessions.set(session.id, session);
  }

  // Private helper methods
  private detectBiases(session: DecisionSession | ThinkingSession): Array<{
    type: 'confirmation' | 'anchoring' | 'availability' | 'representativeness' | 'overconfidence' | 'sunk_cost' | 'status_quo' | 'framing' | 'groupthink' | 'recency';
    severity: number;
    description: string;
    evidence: string[];
    mitigation: string;
  }> {
    const biases: Array<{
      type: 'confirmation' | 'anchoring' | 'availability' | 'representativeness' | 'overconfidence' | 'sunk_cost' | 'status_quo' | 'framing' | 'groupthink' | 'recency';
      severity: number;
      description: string;
      evidence: string[];
      mitigation: string;
    }> = [];

    if ('criteria' in session) {
      const decisionSession = session as DecisionSession;
      
      // Check for confirmation bias
      if (this.hasConfirmationBias(decisionSession)) {
        biases.push({
          type: 'confirmation',
          severity: 0.7,
          description: 'Evidence suggests preference for information that confirms existing beliefs',
          evidence: ['Limited criteria exploration', 'One-sided option evaluation'],
          mitigation: 'Seek disconfirming evidence and alternative perspectives'
        });
      }

      // Check for anchoring bias
      if (this.hasAnchoringBias(decisionSession)) {
        biases.push({
          type: 'anchoring',
          severity: 0.6,
          description: 'First information received may be unduly influencing the decision',
          evidence: ['Early criteria given higher weights', 'First option evaluated differently'],
          mitigation: 'Re-evaluate criteria weights and option scores independently'
        });
      }

      // Check for availability bias
      if (this.hasAvailabilityBias(decisionSession)) {
        biases.push({
          type: 'availability',
          severity: 0.5,
          description: 'Recent or easily recalled information may be overemphasized',
          evidence: ['Limited option exploration', 'Recent events heavily weighted'],
          mitigation: 'Systematically explore all relevant options and historical data'
        });
      }
    } else if ('thoughts' in session) {
      const thinkingSession = session as ThinkingSession;
      
      // Check for overconfidence bias
      if (this.hasOverconfidenceBias(thinkingSession)) {
        biases.push({
          type: 'overconfidence',
          severity: 0.6,
          description: 'Confidence level may be higher than warranted by evidence',
          evidence: ['High confidence with limited exploration', 'Few alternative perspectives'],
          mitigation: 'Seek external validation and consider alternative viewpoints'
        });
      }
    }

    return biases;
  }

  private hasConfirmationBias(session: DecisionSession): boolean {
    // Simple heuristic: if most criteria favor one type of option
    const criteriaTypes = session.criteria.map(c => c.type);
    const typeCounts = criteriaTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxTypeCount = Math.max(...Object.values(typeCounts));
    return maxTypeCount / criteriaTypes.length > 0.7;
  }

  private hasAnchoringBias(session: DecisionSession): boolean {
    // Check if first criteria has significantly higher weight
    if (session.criteria.length > 1) {
      const firstWeight = session.criteria[0].weight;
      const avgWeight = session.criteria.reduce((sum, c) => sum + c.weight, 0) / session.criteria.length;
      return firstWeight > avgWeight * 1.5;
    }
    return false;
  }

  private hasAvailabilityBias(session: DecisionSession): boolean {
    // Check if options are limited or similar
    return session.options.length < 3 || this.areOptionsSimilar(session.options);
  }

  private hasOverconfidenceBias(session: ThinkingSession): boolean {
    // Check if conclusion is reached too quickly
    return Boolean(session.conclusion) && session.thoughts.length < 5;
  }

  private areOptionsSimilar(options: Array<{ description: string }>): boolean {
    // Simple similarity check based on description length and content
    const avgLength = options.reduce((sum, opt) => sum + opt.description.length, 0) / options.length;
    const lengthVariance = options.reduce((sum, opt) => sum + Math.pow(opt.description.length - avgLength, 2), 0) / options.length;
    return Math.sqrt(lengthVariance) < avgLength * 0.3;
  }

  private calculateBiasScore(biases: Array<{ severity: number }>): number {
    if (biases.length === 0) return 0;
    return biases.reduce((sum, bias) => sum + bias.severity, 0) / biases.length;
  }

  private calculateBiasConfidence(biases: Array<{ evidence: string[] }>): number {
    // Higher confidence with more evidence
    const totalEvidence = biases.reduce((sum, bias) => sum + bias.evidence.length, 0);
    return Math.min(1, totalEvidence / (biases.length * 3));
  }

  private generateBiasRecommendations(biases: Array<{ mitigation: string }>): string[] {
    const recommendations: string[] = [];
    
    biases.forEach(bias => {
      recommendations.push(bias.mitigation);
    });

    // Add general recommendations
    if (biases.length > 0) {
      recommendations.push('Consider involving external stakeholders for objective perspective');
      recommendations.push('Document decision rationale for future reference');
    }

    return recommendations.slice(0, 5);
  }

  private getSeverityLevel(score: number): string {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    if (score >= 0.2) return 'low';
    return 'minimal';
  }

  private validateCriteriaConsistency(session: DecisionSession, errors: string[], warnings: string[]): void {
    const totalWeight = session.criteria.reduce((sum, c) => sum + c.weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.1) {
      warnings.push(`Criteria weights sum to ${totalWeight.toFixed(2)}, not 1.0`);
    }

    if (session.criteria.length < 2) {
      errors.push('At least 2 criteria are required for meaningful comparison');
    }

    const duplicateNames = session.criteria
      .map(c => c.name.toLowerCase())
      .filter((name, index, arr) => arr.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      errors.push(`Duplicate criteria names found: ${duplicateNames.join(', ')}`);
    }
  }

  private validateEvaluationCompleteness(session: DecisionSession, errors: string[], _warnings: string[]): void {
    const evaluatedOptions = new Set(session.evaluations.map(e => e.optionId));
    const allOptions = new Set(session.options.map(o => o.id));

    for (const optionId of allOptions) {
      if (!evaluatedOptions.has(optionId)) {
        errors.push(`Option ${session.options.find(o => o.id === optionId)?.name} has not been evaluated`);
      }
    }

    for (const evaluation of session.evaluations) {
      if (evaluation.scores.length !== session.criteria.length) {
        errors.push(`Evaluation for option ${evaluation.optionId} has ${evaluation.scores.length} scores but ${session.criteria.length} criteria`);
      }
    }
  }

  private validateScoreConsistency(session: DecisionSession, errors: string[], warnings: string[], suggestions: string[]): void {
    for (const evaluation of session.evaluations) {
      for (const score of evaluation.scores) {
        if (score.score < 0 || score.score > 10) {
          errors.push(`Invalid score ${score.score} for criteria ${score.criteriaId}`);
        }
        
        if (!score.reasoning || score.reasoning.trim().length < 10) {
          warnings.push(`Score for criteria ${score.criteriaId} lacks detailed reasoning`);
        }
      }
    }

    // Check for score distribution
    const allScores = session.evaluations.flatMap(e => e.scores.map(s => s.score));
    const avgScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    
    if (avgScore < 3) {
      suggestions.push('Consider if all options are viable - average score is very low');
    } else if (avgScore > 8) {
      suggestions.push('Consider if criteria are too lenient - average score is very high');
    }
  }

  private validateOptionCompleteness(session: DecisionSession, errors: string[], warnings: string[]): void {
    if (session.options.length < 2) {
      errors.push('At least 2 options are required for meaningful decision making');
    }

    for (const option of session.options) {
      if (!option.pros || option.pros.length === 0) {
        warnings.push(`Option ${option.name} has no pros listed`);
      }
      
      if (!option.cons || option.cons.length === 0) {
        warnings.push(`Option ${option.name} has no cons listed`);
      }
    }
  }

  private calculateLogicConsistency(_session: DecisionSession, errors: string[], warnings: string[]): number {
    let consistency = 1.0;
    
    // Reduce consistency based on errors and warnings
    consistency -= errors.length * 0.2;
    consistency -= warnings.length * 0.05;
    
    return Math.max(0, consistency);
  }

  private identifyRisks(session: DecisionSession, includeMitigation: boolean = false): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    // Risk from low-scoring options
    for (const evaluation of session.evaluations) {
      if (evaluation.weightedScore < 4) {
        const option = session.options.find(o => o.id === evaluation.optionId);
        if (option) {
          risks.push({
            level: 'high',
            probability: 0.7,
            impact: 0.8,
            description: `High risk of poor performance with ${option.name}`,
            mitigation: includeMitigation ? ['Improve option before implementation', 'Develop contingency plan'] : [],
            monitoring: ['Track key performance indicators', 'Regular progress reviews']
          });
        }
      }
    }

    // Risk from incomplete evaluation
    if (session.evaluations.length < session.options.length) {
      risks.push({
        level: 'medium',
        probability: 0.6,
        impact: 0.5,
        description: 'Incomplete evaluation of all options',
        mitigation: includeMitigation ? ['Complete evaluation of remaining options'] : [],
        monitoring: ['Ensure all options are properly assessed']
      });
    }

    // Risk from criteria imbalance
    const totalWeight = session.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.2) {
      risks.push({
        level: 'low',
        probability: 0.4,
        impact: 0.3,
        description: 'Criteria weights may not reflect true priorities',
        mitigation: includeMitigation ? ['Review and adjust criteria weights'] : [],
        monitoring: ['Validate criteria importance with stakeholders']
      });
    }

    return risks;
  }

  private createAlternatives(session: DecisionSession, params: GenerateAlternativesParams): Alternative[] {
    const alternatives: Alternative[] = [];
    const maxAlternatives = params.maxAlternatives || 3;

    // Create hybrid alternatives
    if (session.options.length >= 2) {
      alternatives.push({
        id: uuidv4(),
        name: 'Hybrid Approach',
        description: 'Combination of best elements from multiple options',
        pros: ['Leverages strengths of multiple options', 'Reduces individual option weaknesses'],
        cons: ['More complex to implement', 'Potential for conflicting approaches'],
        feasibility: 0.6,
        innovation: 0.8
      });
    }

    // Create incremental alternatives
    alternatives.push({
      id: uuidv4(),
      name: 'Phased Implementation',
      description: 'Implement solution in stages with learning and adjustment',
      pros: ['Lower initial risk', 'Opportunity to learn and improve'],
      cons: ['Longer timeline', 'May miss time-sensitive opportunities'],
      feasibility: 0.8,
      innovation: 0.4
    });

    // Create innovative alternatives
    alternatives.push({
      id: uuidv4(),
      name: 'Innovative Solution',
      description: 'Explore novel approaches not yet considered',
      pros: ['Potential for breakthrough results', 'Competitive advantage'],
      cons: ['Higher uncertainty', 'May require significant research'],
      feasibility: 0.3,
      innovation: 0.9
    });

    return alternatives.slice(0, maxAlternatives);
  }

  private calculateOverallQuality(
    biasAnalysis: BiasAnalysis | undefined,
    logicValidation: LogicValidation | undefined,
    riskAssessment: RiskAssessment[]
  ): number {
    let quality = 1.0;

    if (biasAnalysis) {
      quality -= biasAnalysis.overallBiasScore * 0.3;
    }

    if (logicValidation) {
      quality -= (1 - logicValidation.consistency) * 0.4;
    }

    const criticalRisks = riskAssessment.filter(r => r.level === 'critical').length;
    quality -= criticalRisks * 0.1;

    return Math.max(0, quality);
  }

  private generateComprehensiveRecommendations(
    biasAnalysis: BiasAnalysis | undefined,
    logicValidation: LogicValidation | undefined,
    riskAssessment: RiskAssessment[],
    alternatives: Alternative[]
  ): string[] {
    const recommendations: string[] = [];

    if (biasAnalysis && biasAnalysis.overallBiasScore > 0.5) {
      recommendations.push('Address identified biases before finalizing decision');
    }

    if (logicValidation && !logicValidation.isValid) {
      recommendations.push('Resolve logic validation errors');
    }

    if (riskAssessment.some(r => r.level === 'critical')) {
      recommendations.push('Develop mitigation strategies for critical risks');
    }

    if (alternatives.length > 0) {
      recommendations.push('Consider generated alternatives');
    }

    recommendations.push('Document decision rationale for future reference');
    recommendations.push('Establish monitoring and review processes');

    return recommendations;
  }
}
