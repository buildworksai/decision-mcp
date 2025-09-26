#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SequentialThinkingTool } from './tools/sequential-thinking.js';
import { DecisionMakerTool } from './tools/decision-maker.js';
import { DecisionAnalyzerTool } from './tools/decision-analyzer.js';
import { ExternalDataTool } from './tools/external-data-tool.js';
import { VisualizationTool } from './tools/visualization-tool.js';
import { NLPTool } from './tools/nlp-tool.js';
import { sessionRateLimiter, globalRateLimiter, analysisRateLimiter } from './services/rate-limiter.js';
import { createSecurityMiddleware } from './services/security.js';
import { performanceMonitor } from './services/performance.js';
import { i18nService } from './services/i18n.js';

class DecisionMCPServer {
  private server: Server;
  private sequentialThinking: SequentialThinkingTool;
  private decisionMaker: DecisionMakerTool;
  private decisionAnalyzer: DecisionAnalyzerTool;
  private externalData: ExternalDataTool;
  private visualization: VisualizationTool;
  private nlp: NLPTool;
  private security = createSecurityMiddleware();

  constructor() {
    this.server = new Server(
      {
        name: 'Decision MCP by BuildWorks.AI',
        version: '2.1.0',
      }
    );

    this.sequentialThinking = new SequentialThinkingTool();
    this.decisionMaker = new DecisionMakerTool();
    this.decisionAnalyzer = new DecisionAnalyzerTool();
    this.externalData = new ExternalDataTool();
    this.visualization = new VisualizationTool();
    this.nlp = new NLPTool();

    // Initialize i18n
    i18nService.initialize('en').catch(console.error);

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Sequential Thinking Tools
          {
            name: 'start_thinking',
            description: 'Start a new sequential thinking session to break down complex problems',
            inputSchema: {
              type: 'object',
              properties: {
                problem: {
                  type: 'string',
                  description: 'The problem or question to think through sequentially'
                },
                context: {
                  type: 'string',
                  description: 'Additional context for the problem'
                },
                maxThoughts: {
                  type: 'number',
                  description: 'Maximum number of thoughts allowed (default: 50)'
                }
              },
              required: ['problem']
            }
          },
          {
            name: 'add_thought',
            description: 'Add a thought to an existing thinking session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the thinking session'
                },
                thought: {
                  type: 'string',
                  description: 'The thought content to add'
                },
                parentId: {
                  type: 'string',
                  description: 'ID of parent thought (optional)'
                },
                branchId: {
                  type: 'string',
                  description: 'ID of branch to add thought to (optional)'
                }
              },
              required: ['sessionId', 'thought']
            }
          },
          {
            name: 'revise_thought',
            description: 'Revise an existing thought in a thinking session',
            inputSchema: {
              type: 'object',
              properties: {
                thoughtId: {
                  type: 'string',
                  description: 'ID of the thought to revise'
                },
                newThought: {
                  type: 'string',
                  description: 'The revised thought content'
                },
                reason: {
                  type: 'string',
                  description: 'Reason for the revision'
                }
              },
              required: ['thoughtId', 'newThought']
            }
          },
          {
            name: 'branch_from_thought',
            description: 'Create a new branch from an existing thought',
            inputSchema: {
              type: 'object',
              properties: {
                thoughtId: {
                  type: 'string',
                  description: 'ID of the thought to branch from'
                },
                newDirection: {
                  type: 'string',
                  description: 'The new direction to explore'
                },
                description: {
                  type: 'string',
                  description: 'Description of the branch'
                }
              },
              required: ['thoughtId', 'newDirection']
            }
          },
          {
            name: 'analyze_thinking_progress',
            description: 'Analyze the progress of a thinking session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the thinking session'
                },
                includeBranches: {
                  type: 'boolean',
                  description: 'Whether to include branch analysis'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'conclude_thinking',
            description: 'Conclude a thinking session with a final conclusion',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the thinking session'
                },
                conclusion: {
                  type: 'string',
                  description: 'The final conclusion'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence level in the conclusion (0-1)'
                }
              },
              required: ['sessionId', 'conclusion']
            }
          },
          {
            name: 'get_thinking_session',
            description: 'Get details of a thinking session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the thinking session'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'list_thinking_sessions',
            description: 'List all thinking sessions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          // Decision Making Tools
          {
            name: 'start_decision',
            description: 'Start a new decision-making session',
            inputSchema: {
              type: 'object',
              properties: {
                context: {
                  type: 'string',
                  description: 'Context and description of the decision to be made'
                },
                description: {
                  type: 'string',
                  description: 'Additional description of the decision'
                },
                deadline: {
                  type: 'string',
                  description: 'Deadline for the decision'
                }
              },
              required: ['context']
            }
          },
          {
            name: 'add_criteria',
            description: 'Add evaluation criteria to a decision session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                name: {
                  type: 'string',
                  description: 'Name of the criteria'
                },
                description: {
                  type: 'string',
                  description: 'Description of the criteria'
                },
                weight: {
                  type: 'number',
                  description: 'Weight of the criteria (0-1)'
                },
                type: {
                  type: 'string',
                  enum: ['benefit', 'cost', 'risk', 'feasibility'],
                  description: 'Type of criteria'
                }
              },
              required: ['sessionId', 'name', 'description', 'weight', 'type']
            }
          },
          {
            name: 'add_option',
            description: 'Add an option to a decision session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                name: {
                  type: 'string',
                  description: 'Name of the option'
                },
                description: {
                  type: 'string',
                  description: 'Description of the option'
                },
                pros: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of advantages'
                },
                cons: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of disadvantages'
                },
                risks: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of risks'
                },
                estimatedCost: {
                  type: 'number',
                  description: 'Estimated cost'
                },
                estimatedTime: {
                  type: 'string',
                  description: 'Estimated time to implement'
                }
              },
              required: ['sessionId', 'name', 'description', 'pros', 'cons', 'risks']
            }
          },
          {
            name: 'evaluate_option',
            description: 'Evaluate an option against criteria',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                optionId: {
                  type: 'string',
                  description: 'ID of the option to evaluate'
                },
                scores: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      score: {
                        type: 'number',
                        description: 'Score for this criteria (0-10)'
                      },
                      reasoning: {
                        type: 'string',
                        description: 'Reasoning for the score'
                      }
                    },
                    required: ['score', 'reasoning']
                  },
                  description: 'Scores for each criteria'
                }
              },
              required: ['sessionId', 'optionId', 'scores']
            }
          },
          {
            name: 'analyze_decision',
            description: 'Analyze a decision session and provide insights',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                includeAlternatives: {
                  type: 'boolean',
                  description: 'Whether to include alternative suggestions'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'make_recommendation',
            description: 'Make a final recommendation based on the decision analysis',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                minConfidence: {
                  type: 'number',
                  description: 'Minimum confidence level required (0-1)'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'get_decision_session',
            description: 'Get details of a decision session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'list_decision_sessions',
            description: 'List all decision sessions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          // Decision Analyzer Tools
          {
            name: 'analyze_bias',
            description: 'Analyze potential biases in a decision or thinking session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the session to analyze'
                },
                includeMitigation: {
                  type: 'boolean',
                  description: 'Whether to include bias mitigation strategies'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'validate_logic',
            description: 'Validate the logical consistency of a decision session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                strictMode: {
                  type: 'boolean',
                  description: 'Whether to use strict validation mode'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'assess_risks',
            description: 'Assess risks associated with a decision',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                includeMitigation: {
                  type: 'boolean',
                  description: 'Whether to include risk mitigation strategies'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'generate_alternatives',
            description: 'Generate alternative options for a decision',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the decision session'
                },
                maxAlternatives: {
                  type: 'number',
                  description: 'Maximum number of alternatives to generate'
                },
                focusAreas: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Areas to focus on when generating alternatives'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'comprehensive_analysis',
            description: 'Perform comprehensive analysis including bias, logic, and risk assessment',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID of the session to analyze'
                },
                includeAll: {
                  type: 'boolean',
                  description: 'Whether to include all analysis components'
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
          // Sequential Thinking Tools
          case 'start_thinking':
            return await this.handleStartThinking(args);
          case 'add_thought':
            return await this.handleAddThought(args);
          case 'revise_thought':
            return await this.handleReviseThought(args);
          case 'branch_from_thought':
            return await this.handleBranchFromThought(args);
          case 'analyze_thinking_progress':
            return await this.handleAnalyzeThinkingProgress(args);
          case 'conclude_thinking':
            return await this.handleConcludeThinking(args);
          case 'get_thinking_session':
            return await this.handleGetThinkingSession(args);
          case 'list_thinking_sessions':
            return await this.handleListThinkingSessions(args);

          // Decision Making Tools
          case 'start_decision':
            return await this.handleStartDecision(args);
          case 'add_criteria':
            return await this.handleAddCriteria(args);
          case 'add_option':
            return await this.handleAddOption(args);
          case 'evaluate_option':
            return await this.handleEvaluateOption(args);
          case 'analyze_decision':
            return await this.handleAnalyzeDecision(args);
          case 'make_recommendation':
            return await this.handleMakeRecommendation(args);
          case 'get_decision_session':
            return await this.handleGetDecisionSession(args);
          case 'list_decision_sessions':
            return await this.handleListDecisionSessions(args);

          // Decision Analyzer Tools
          case 'analyze_bias':
            return await this.handleAnalyzeBias(args);
          case 'validate_logic':
            return await this.handleValidateLogic(args);
          case 'assess_risks':
            return await this.handleAssessRisks(args);
          case 'generate_alternatives':
            return await this.handleGenerateAlternatives(args);
          case 'comprehensive_analysis':
            return await this.handleComprehensiveAnalysis(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
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

  // Sequential Thinking Tool Handlers
  private async handleStartThinking(args: Record<string, unknown>) {
    return performanceMonitor.measureAsync('handleStartThinking', async () => {
      // Apply global rate limiting
      globalRateLimiter.isAllowed('global');
      
      // Validate and sanitize input
      const problem = this.security.validateInput(args.problem as string, 'problem');
      const sanitizedArgs = { ...args, problem };
      
      const result = await this.sequentialThinking.startThinking(sanitizedArgs as any);
      
      // Audit the action
      this.security.auditAction('start_thinking', result.data?.id, { 
        problemLength: problem.length 
      });
      
      return this.formatResponse(result);
    });
  }

  private async handleAddThought(args: Record<string, unknown>) {
    return performanceMonitor.measureAsync('handleAddThought', async () => {
      // Apply session rate limiting
      const sessionId = args.sessionId as string;
      sessionRateLimiter.isAllowed(sessionId);
      
      // Validate and sanitize input
      const thought = this.security.validateInput(args.thought as string, 'thought');
      const sanitizedArgs = { ...args, thought };
      
      const result = this.sequentialThinking.addThought(sanitizedArgs as any);
      
      // Audit the action
      this.security.auditAction('add_thought', sessionId, { 
        thoughtLength: thought.length 
      });
      
      return this.formatResponse(result);
    });
  }

  private async handleReviseThought(args: Record<string, unknown>) {
    const result = this.sequentialThinking.reviseThought(args as any);
    return this.formatResponse(result);
  }

  private async handleBranchFromThought(args: Record<string, unknown>) {
    const result = this.sequentialThinking.branchFromThought(args as any);
    return this.formatResponse(result);
  }

  private async handleAnalyzeThinkingProgress(args: Record<string, unknown>) {
    const result = this.sequentialThinking.analyzeProgress(args as any);
    return this.formatResponse(result);
  }

  private async handleConcludeThinking(args: Record<string, unknown>) {
    const result = this.sequentialThinking.concludeThinking(args as any);
    return this.formatResponse(result);
  }

  private async handleGetThinkingSession(args: Record<string, unknown>) {
    const result = await this.sequentialThinking.getSession(args.sessionId as string);
    return this.formatResponse(result);
  }

  private async handleListThinkingSessions(_args: Record<string, unknown>) {
    const result = this.sequentialThinking.listSessions();
    return this.formatResponse(result);
  }

  // Decision Making Tool Handlers
  private async handleStartDecision(args: Record<string, unknown>) {
    const result = this.decisionMaker.startDecision(args as any);
    return this.formatResponse(result);
  }

  private async handleAddCriteria(args: Record<string, unknown>) {
    const result = this.decisionMaker.addCriteria(args as any);
    return this.formatResponse(result);
  }

  private async handleAddOption(args: Record<string, unknown>) {
    const result = this.decisionMaker.addOption(args as any);
    return this.formatResponse(result);
  }

  private async handleEvaluateOption(args: Record<string, unknown>) {
    const result = this.decisionMaker.evaluateOption(args as any);
    return this.formatResponse(result);
  }

  private async handleAnalyzeDecision(args: Record<string, unknown>) {
    const result = this.decisionMaker.analyzeDecision(args as any);
    return this.formatResponse(result);
  }

  private async handleMakeRecommendation(args: Record<string, unknown>) {
    const result = this.decisionMaker.makeRecommendation(args as any);
    return this.formatResponse(result);
  }

  private async handleGetDecisionSession(args: Record<string, unknown>) {
    const result = this.decisionMaker.getSession(args.sessionId as string);
    return this.formatResponse(result);
  }

  private async handleListDecisionSessions(_args: Record<string, unknown>) {
    const result = this.decisionMaker.listSessions();
    return this.formatResponse(result);
  }

  // Decision Analyzer Tool Handlers
  private async handleAnalyzeBias(args: Record<string, unknown>) {
    // First get the session to analyze
    const session = await this.getSessionForAnalysis(args.sessionId as string);
    if (session) {
      this.decisionAnalyzer.setSession(session as any);
    }
    
    const result = this.decisionAnalyzer.analyzeBias(args as any);
    return this.formatResponse(result);
  }

  private async handleValidateLogic(args: Record<string, unknown>) {
    const session = await this.getSessionForAnalysis(args.sessionId as string);
    if (session) {
      this.decisionAnalyzer.setSession(session as any);
    }
    
    const result = this.decisionAnalyzer.validateLogic(args as any);
    return this.formatResponse(result);
  }

  private async handleAssessRisks(args: Record<string, unknown>) {
    const session = await this.getSessionForAnalysis(args.sessionId as string);
    if (session) {
      this.decisionAnalyzer.setSession(session as any);
    }
    
    const result = this.decisionAnalyzer.assessRisks(args as any);
    return this.formatResponse(result);
  }

  private async handleGenerateAlternatives(args: Record<string, unknown>) {
    const session = await this.getSessionForAnalysis(args.sessionId as string);
    if (session) {
      this.decisionAnalyzer.setSession(session as any);
    }
    
    const result = this.decisionAnalyzer.generateAlternatives(args as any);
    return this.formatResponse(result);
  }

  private async handleComprehensiveAnalysis(args: Record<string, unknown>) {
    const session = await this.getSessionForAnalysis(args.sessionId as string);
    if (session) {
      this.decisionAnalyzer.setSession(session as any);
    }
    
    const result = this.decisionAnalyzer.comprehensiveAnalysis(args as any);
    return this.formatResponse(result);
  }

  // Helper methods
  private async getSessionForAnalysis(sessionId: string): Promise<unknown> {
    // Try to get from decision maker first
    const decisionResult = this.decisionMaker.getSession(sessionId);
    if (decisionResult.success && decisionResult.data) {
      return { ...decisionResult.data, type: 'decision' };
    }

    // Try to get from sequential thinking
    const thinkingResult = await this.sequentialThinking.getSession(sessionId);
    if (thinkingResult.success && thinkingResult.data) {
      return { ...thinkingResult.data, type: 'thinking' };
    }

    return null;
  }

  private formatResponse(result: { success: boolean; data?: unknown; error?: string; metadata?: Record<string, unknown> }) {
    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: result.data,
              metadata: result.metadata
            }, null, 2)
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: result.error
            }, null, 2)
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

// Start the server
const server = new DecisionMCPServer();
server.run().catch(console.error);
