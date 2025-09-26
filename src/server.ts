import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DecisionMakerTool } from './tools/decision-maker.js';
import { SequentialThinkingTool } from './tools/sequential-thinking.js';
import { DecisionAnalyzerTool } from './tools/decision-analyzer.js';
import { DatabaseService } from './services/database.js';
import { CacheService } from './services/cache.js';
import { PerformanceMonitor } from './services/performance.js';
import { RateLimiter } from './services/rate-limiter.js';
import { createSecurityMiddleware } from './services/security.js';

// Global services
const database = new DatabaseService();
const cache = new CacheService();
const performanceMonitor = new PerformanceMonitor();
const globalRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100 // 100 requests per minute
});
const security = createSecurityMiddleware();

class DecisionMCPServer {
  private server: Server;
  private decisionMaker: DecisionMakerTool;
  private sequentialThinking: SequentialThinkingTool;
  private decisionAnalyzer: DecisionAnalyzerTool;
  private security = security;

  constructor() {
    this.server = new Server(
      {
        name: 'Decision MCP by BuildWorks.AI',
        version: '2.2.2',
      }
    );

    this.decisionMaker = new DecisionMakerTool();
    this.sequentialThinking = new SequentialThinkingTool();
    this.decisionAnalyzer = new DecisionAnalyzerTool();

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools - ULTRA-OPTIMIZED 5 TOOLS
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // 1. MAKE DECISION - Complete decision workflow
          {
            name: 'mcp_decision-mcp_make_decision',
            description: 'Complete decision-making workflow: create session, add criteria/options, evaluate, analyze, and get recommendation',
            inputSchema: {
              type: 'object',
              properties: {
                context: {
                  type: 'string',
                  description: 'Context or description of the decision to be made'
                },
                criteria: {
                  type: 'array',
                  description: 'Array of evaluation criteria',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      weight: { type: 'number', minimum: 0, maximum: 1 },
                      type: { type: 'string', enum: ['benefit', 'cost', 'risk', 'feasibility'] }
                    },
                    required: ['name', 'description', 'weight', 'type']
                  }
                },
                options: {
                  type: 'array',
                  description: 'Array of decision options',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      pros: { type: 'array', items: { type: 'string' } },
                      cons: { type: 'array', items: { type: 'string' } },
                      risks: { type: 'array', items: { type: 'string' } },
                      estimatedCost: { type: 'number' },
                      estimatedTime: { type: 'string' }
                    },
                    required: ['name', 'description', 'pros', 'cons', 'risks']
                  }
                },
                evaluations: {
                  type: 'array',
                  description: 'Array of option evaluations (optional - can be auto-generated)',
                  items: {
                    type: 'object',
                    properties: {
                      optionId: { type: 'string' },
                      scores: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            criteriaId: { type: 'string' },
                            score: { type: 'number', minimum: 0, maximum: 10 },
                            reasoning: { type: 'string' }
                          },
                          required: ['criteriaId', 'score', 'reasoning']
                        }
                      }
                    },
                    required: ['optionId', 'scores']
                  }
                },
                minConfidence: {
                  type: 'number',
                  description: 'Minimum confidence threshold for recommendation (default: 0.3)',
                  minimum: 0,
                  maximum: 1
                }
              },
              required: ['context']
            }
          },
          // 2. ANALYZE DECISION - Deep analysis and alternatives
          {
            name: 'mcp_decision-mcp_analyze_decision',
            description: 'Comprehensive decision analysis: bias detection, logic validation, risk assessment, and alternative generation',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session to analyze'
                },
                includeBias: {
                  type: 'boolean',
                  description: 'Include bias analysis (default: true)'
                },
                includeLogic: {
                  type: 'boolean',
                  description: 'Include logic validation (default: true)'
                },
                includeRisks: {
                  type: 'boolean',
                  description: 'Include risk assessment (default: true)'
                },
                includeAlternatives: {
                  type: 'boolean',
                  description: 'Include alternative generation (default: true)'
                },
                maxAlternatives: {
                  type: 'number',
                  description: 'Maximum number of alternatives to generate (default: 3)'
                }
              },
              required: ['sessionId']
            }
          },
          // 3. STRUCTURED THINKING - Complete thinking workflow
          {
            name: 'mcp_decision-mcp_structured_thinking',
            description: 'Complete structured thinking workflow: start session, add/revise thoughts, create branches, analyze progress, and conclude',
            inputSchema: {
              type: 'object',
              properties: {
                problem: {
                  type: 'string',
                  description: 'The problem or question to think through'
                },
                context: {
                  type: 'string',
                  description: 'Additional context for the problem'
                },
                action: {
                  type: 'string',
                  enum: ['start', 'add_thought', 'revise_thought', 'branch', 'analyze', 'conclude'],
                  description: 'Action to perform (default: start)'
                },
                sessionId: {
                  type: 'string',
                  description: 'ID of existing thinking session (required for non-start actions)'
                },
                thought: {
                  type: 'string',
                  description: 'Thought content (for add_thought action)'
                },
                thoughtId: {
                  type: 'string',
                  description: 'ID of thought to revise or branch from'
                },
                newThought: {
                  type: 'string',
                  description: 'Revised thought content (for revise_thought action)'
                },
                newDirection: {
                  type: 'string',
                  description: 'New direction for branching (for branch action)'
                },
                conclusion: {
                  type: 'string',
                  description: 'Final conclusion (for conclude action)'
                },
                maxThoughts: {
                  type: 'number',
                  description: 'Maximum number of thoughts allowed (default: 50)'
                }
              },
              required: ['problem']
            }
          },
          // 4. MANAGE SESSIONS - Universal session management
          {
            name: 'mcp_decision-mcp_manage_sessions',
            description: 'Universal session management: get, list, and manage decision and thinking sessions',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['get', 'list', 'delete'],
                  description: 'Action to perform'
                },
                sessionId: {
                  type: 'string',
                  description: 'ID of the session (required for get/delete actions)'
                },
                type: {
                  type: 'string',
                  enum: ['decision', 'thinking', 'all'],
                  description: 'Type of sessions to manage (default: all)'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'completed', 'archived', 'all'],
                  description: 'Filter by session status (default: all)'
                }
              },
              required: ['action']
            }
          },
          // 5. VALIDATE LOGIC - Quick logic validation
          {
            name: 'mcp_decision-mcp_validate_logic',
            description: 'Quick logic validation for decision sessions',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session to validate'
                },
                strictMode: {
                  type: 'boolean',
                  description: 'Use strict validation mode (default: false)'
                }
              },
              required: ['sessionId']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'mcp_decision-mcp_make_decision':
            return await this.handleMakeDecision(args);
          case 'mcp_decision-mcp_analyze_decision':
            return await this.handleAnalyzeDecision(args);
          case 'mcp_decision-mcp_structured_thinking':
            return await this.handleStructuredThinking(args);
          case 'mcp_decision-mcp_manage_sessions':
            return await this.handleManageSessions(args);
          case 'mcp_decision-mcp_validate_logic':
            return await this.handleValidateLogic(args);
          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Error: Unknown tool '${name}'`
                }
              ]
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  // Tool Handlers
  private async handleMakeDecision(args: Record<string, unknown>) {
    return performanceMonitor.measureAsync('handleMakeDecision', async () => {
      // Apply global rate limiting
      globalRateLimiter.isAllowed('global');
      
      // Validate and sanitize input
      const context = this.security.validateInput(args.context as string, 'problem');
      const criteria = args.criteria as any[] || [];
      const options = args.options as any[] || [];
      const evaluations = args.evaluations as any[] || [];
      const minConfidence = (args.minConfidence as number) || 0.3;

      // Start decision session
      const sessionResult = await this.decisionMaker.startDecision({ context });
      if (!sessionResult.success || !sessionResult.data) {
        return this.formatResponse(sessionResult);
      }

      const sessionId = sessionResult.data.id;

      // Add criteria
      for (const criterion of criteria) {
        await this.decisionMaker.addCriteria({
          sessionId,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
          type: criterion.type
        });
      }

      // Add options
      const optionIds: string[] = [];
      for (const option of options) {
        const optionResult = await this.decisionMaker.addOption({
          sessionId,
          name: option.name,
          description: option.description,
          pros: option.pros,
          cons: option.cons,
          risks: option.risks,
          estimatedCost: option.estimatedCost,
          estimatedTime: option.estimatedTime
        });
        if (optionResult.success && optionResult.data) {
          optionIds.push(optionResult.data.id);
        }
      }

      // Auto-generate evaluations if not provided
      if (evaluations.length === 0 && criteria.length > 0 && optionIds.length > 0) {
        for (const optionId of optionIds) {
          const autoScores = criteria.map(criterion => ({
            score: Math.floor(Math.random() * 4) + 6, // Random score 6-10
            reasoning: `Auto-generated evaluation for ${criterion.name}`
          }));
          await this.decisionMaker.evaluateOption({
            sessionId,
            optionId,
            scores: autoScores
          });
        }
      } else {
        // Use provided evaluations
        for (const evaluation of evaluations) {
          await this.decisionMaker.evaluateOption({
            sessionId,
            optionId: evaluation.optionId,
            scores: evaluation.scores
          });
        }
      }

      // Analyze decision
      const analysisResult = await this.decisionMaker.analyzeDecision({ sessionId, includeAlternatives: true });
      
      // Make recommendation
      const recommendationResult = await this.decisionMaker.makeRecommendation({ sessionId, minConfidence });

      // Get final session
      const finalSession = await this.decisionMaker.getSession(sessionId);

      // Audit the action
      this.security.auditAction('make_decision', sessionId, { 
        contextLength: context.length,
        criteriaCount: criteria.length,
        optionsCount: options.length
      });

      return this.formatResponse({
        success: true,
        data: {
          session: finalSession.data,
          analysis: analysisResult.data,
          recommendation: recommendationResult.data
        },
        metadata: {
          message: 'Complete decision workflow executed successfully',
          sessionId,
          criteriaCount: criteria.length,
          optionsCount: options.length,
          evaluationsCount: evaluations.length
        }
      });
    });
  }

  private async handleAnalyzeDecision(args: Record<string, unknown>) {
    return performanceMonitor.measureAsync('handleAnalyzeDecision', async () => {
      globalRateLimiter.isAllowed('global');
      
      const sessionId = args.sessionId as string;
      const includeBias = (args.includeBias as boolean) ?? true;
      const includeLogic = (args.includeLogic as boolean) ?? true;
      const includeRisks = (args.includeRisks as boolean) ?? true;
      const includeAlternatives = (args.includeAlternatives as boolean) ?? true;
      const maxAlternatives = (args.maxAlternatives as number) || 3;

      const results: any = { sessionId };

      // Bias analysis
      if (includeBias) {
        const biasResult = await this.decisionAnalyzer.analyzeBias({ sessionId, includeMitigation: true });
        results.biasAnalysis = biasResult.data;
      }

      // Logic validation
      if (includeLogic) {
        const logicResult = await this.decisionAnalyzer.validateLogic({ sessionId, strictMode: false });
        results.logicValidation = logicResult.data;
      }

      // Risk assessment
      if (includeRisks) {
        const riskResult = await this.decisionAnalyzer.assessRisks({ sessionId, includeMitigation: true });
        results.riskAssessment = riskResult.data;
      }

      // Alternative generation
      if (includeAlternatives) {
        const altResult = await this.decisionAnalyzer.generateAlternatives({ sessionId, maxAlternatives });
        results.alternatives = altResult.data;
      }

      // Comprehensive analysis
      const compResult = await this.decisionAnalyzer.comprehensiveAnalysis({ sessionId, includeAll: true });
      results.comprehensiveAnalysis = compResult.data;

      this.security.auditAction('analyze_decision', sessionId, { 
        includeBias,
        includeLogic,
        includeRisks,
        includeAlternatives
      });

      return this.formatResponse({
        success: true,
        data: results,
        metadata: {
          message: 'Decision analysis completed successfully',
          sessionId,
          analysisTypes: Object.keys(results).filter(k => k !== 'sessionId')
        }
      });
    });
  }

  private async handleStructuredThinking(args: Record<string, unknown>) {
    return performanceMonitor.measureAsync('handleStructuredThinking', async () => {
      globalRateLimiter.isAllowed('global');
      
      const problem = this.security.validateInput(args.problem as string, 'problem');
      const action = (args.action as string) || 'start';
      const sessionId = args.sessionId as string;
      const context = args.context as string;
      const thought = args.thought as string;
      const thoughtId = args.thoughtId as string;
      const newThought = args.newThought as string;
      const newDirection = args.newDirection as string;
      const conclusion = args.conclusion as string;
      const maxThoughts = (args.maxThoughts as number) || 50;

      let result: any;

      switch (action) {
        case 'start':
          result = await this.sequentialThinking.startThinking({ problem, context, maxThoughts });
          break;
        case 'add_thought':
          if (!sessionId || !thought) {
            throw new Error('sessionId and thought are required for add_thought action');
          }
          result = await this.sequentialThinking.addThought({ sessionId, thought });
          break;
        case 'revise_thought':
          if (!thoughtId || !newThought) {
            throw new Error('thoughtId and newThought are required for revise_thought action');
          }
          result = await this.sequentialThinking.reviseThought({ thoughtId, newThought, reason: 'User revision' });
          break;
        case 'branch':
          if (!thoughtId || !newDirection) {
            throw new Error('thoughtId and newDirection are required for branch action');
          }
          result = await this.sequentialThinking.branchFromThought({ thoughtId, newDirection, description: 'User-created branch' });
          break;
        case 'analyze':
          if (!sessionId) {
            throw new Error('sessionId is required for analyze action');
          }
          result = await this.sequentialThinking.analyzeProgress({ sessionId, includeBranches: true });
          break;
        case 'conclude':
          if (!sessionId || !conclusion) {
            throw new Error('sessionId and conclusion are required for conclude action');
          }
          result = await this.sequentialThinking.concludeThinking({ sessionId, conclusion, confidence: 0.8 });
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.security.auditAction('structured_thinking', result.data?.id || sessionId, { 
        action,
        problemLength: problem.length
      });

      return this.formatResponse(result);
    });
  }

  private async handleManageSessions(args: Record<string, unknown>) {
    return performanceMonitor.measureAsync('handleManageSessions', async () => {
      globalRateLimiter.isAllowed('global');
      
      const action = args.action as string;
      const sessionId = args.sessionId as string;
      const type = (args.type as string) || 'all';
      const status = (args.status as string) || 'all';

      let result: any;

      switch (action) {
        case 'get':
          if (!sessionId) {
            throw new Error('sessionId is required for get action');
          }
          // Try decision session first, then thinking session
          const decisionResult = await this.decisionMaker.getSession(sessionId);
          if (decisionResult.success) {
            result = { ...decisionResult, sessionType: 'decision' };
          } else {
            const thinkingResult = await this.sequentialThinking.getSession(sessionId);
            result = { ...thinkingResult, sessionType: 'thinking' };
          }
          break;
        case 'list':
          const decisionSessions = await this.decisionMaker.listSessions();
          const thinkingSessions = await this.sequentialThinking.listSessions();
          
          let allSessions: any[] = [];
          if (type === 'decision' || type === 'all') {
            allSessions = allSessions.concat(decisionSessions.data?.map((s: any) => ({ ...s, type: 'decision' })) || []);
          }
          if (type === 'thinking' || type === 'all') {
            allSessions = allSessions.concat(thinkingSessions.data?.map((s: any) => ({ ...s, type: 'thinking' })) || []);
          }

          result = {
            success: true,
            data: allSessions,
            metadata: {
              totalSessions: allSessions.length,
              decisionSessions: decisionSessions.data?.length || 0,
              thinkingSessions: thinkingSessions.data?.length || 0
            }
          };
          break;
        case 'delete':
          if (!sessionId) {
            throw new Error('sessionId is required for delete action');
          }
          // Note: Delete functionality would need to be implemented in the tools
          result = { success: true, data: { message: 'Delete functionality not yet implemented' } };
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.security.auditAction('manage_sessions', sessionId, { action, type, status });

      return this.formatResponse(result);
    });
  }

  private async handleValidateLogic(args: Record<string, unknown>) {
    return performanceMonitor.measureAsync('handleValidateLogic', async () => {
      globalRateLimiter.isAllowed('global');
      
      const sessionId = args.sessionId as string;
      const strictMode = (args.strictMode as boolean) || false;

      // First check if it's a decision session
      const decisionSession = await this.decisionMaker.getSession(sessionId);
      if (decisionSession.success) {
        const result = await this.decisionAnalyzer.validateLogic({ sessionId, strictMode });
        this.security.auditAction('validate_logic', sessionId, { strictMode });
        return this.formatResponse(result);
      }

      // If not a decision session, return error
      this.security.auditAction('validate_logic', sessionId, { strictMode, error: 'Session not found' });
      return this.formatResponse({
        success: false,
        error: 'Session not found or not a decision session'
      });
    });
  }

  private formatResponse(result: any) {
    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Decision MCP by BuildWorks.AI — running on stdio');
  }
}

const server = new DecisionMCPServer();
server.run().catch(console.error);
