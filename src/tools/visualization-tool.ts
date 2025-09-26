import type { ToolResponse, ValidationResult, ThinkingSession, DecisionSession } from '../types/index.js';
import { visualizationService, type VisualizationOptions, type VisualizationResult } from '../services/visualization.js';
import { performanceMonitor } from '../services/performance.js';
import { createSecurityMiddleware } from '../services/security.js';

export class VisualizationTool {
  private security = createSecurityMiddleware();

  /**
   * Generate visualization for a thinking session
   */
  public generateThinkingVisualization(
    session: ThinkingSession,
    options: VisualizationOptions = { format: 'mermaid' }
  ): ToolResponse<VisualizationResult> {
    return performanceMonitor.measure('generateThinkingVisualization', () => {
      try {
        const validation = this.validateVisualizationOptions(options);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }

        const result = visualizationService.generateThinkingDiagram(session, options);
        
        this.security.auditAction('generate_thinking_visualization', session.id, {
          format: options.format,
          includeMetadata: options.includeMetadata,
          nodeCount: result.metadata.nodeCount
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Thinking session visualization generated successfully',
            format: options.format,
            nodeCount: result.metadata.nodeCount
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to generate thinking visualization: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Generate visualization for a decision session
   */
  public generateDecisionVisualization(
    session: DecisionSession,
    options: VisualizationOptions = { format: 'mermaid' }
  ): ToolResponse<VisualizationResult> {
    return performanceMonitor.measure('generateDecisionVisualization', () => {
      try {
        const validation = this.validateVisualizationOptions(options);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }

        const result = visualizationService.generateDecisionDiagram(session, options);
        
        this.security.auditAction('generate_decision_visualization', session.id, {
          format: options.format,
          includeMetadata: options.includeMetadata,
          nodeCount: result.metadata.nodeCount
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Decision session visualization generated successfully',
            format: options.format,
            nodeCount: result.metadata.nodeCount
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to generate decision visualization: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Generate JSON export for any session
   */
  public generateJsonExport(
    session: ThinkingSession | DecisionSession,
    options: VisualizationOptions = { format: 'json' }
  ): ToolResponse<VisualizationResult> {
    return performanceMonitor.measure('generateJsonExport', () => {
      try {
        const validation = this.validateVisualizationOptions(options);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }

        const result = visualizationService.generateJsonExport(session, options);
        
        this.security.auditAction('generate_json_export', session.id, {
          format: options.format,
          includeMetadata: options.includeMetadata
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'JSON export generated successfully',
            format: options.format,
            nodeCount: result.metadata.nodeCount
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to generate JSON export: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Generate Markdown export for any session
   */
  public generateMarkdownExport(
    session: ThinkingSession | DecisionSession,
    options: VisualizationOptions = { format: 'markdown' }
  ): ToolResponse<VisualizationResult> {
    return performanceMonitor.measure('generateMarkdownExport', () => {
      try {
        const validation = this.validateVisualizationOptions(options);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }

        const result = visualizationService.generateMarkdownExport(session, options);
        
        this.security.auditAction('generate_markdown_export', session.id, {
          format: options.format,
          includeMetadata: options.includeMetadata
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Markdown export generated successfully',
            format: options.format,
            nodeCount: result.metadata.nodeCount
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to generate Markdown export: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Generate multiple visualization formats
   */
  public generateMultipleFormats(
    session: ThinkingSession | DecisionSession,
    formats: Array<'mermaid' | 'json' | 'markdown'> = ['mermaid', 'json', 'markdown'],
    options: Omit<VisualizationOptions, 'format'> = {}
  ): ToolResponse<VisualizationResult[]> {
    return performanceMonitor.measure('generateMultipleFormats', () => {
      try {
        const results: VisualizationResult[] = [];
        
        for (const format of formats) {
          const formatOptions: VisualizationOptions = { ...options, format };
          let result: VisualizationResult;
          
          if (format === 'mermaid') {
            if ('criteria' in session) {
              result = visualizationService.generateDecisionDiagram(session, formatOptions);
            } else {
              result = visualizationService.generateThinkingDiagram(session, formatOptions);
            }
          } else if (format === 'json') {
            result = visualizationService.generateJsonExport(session, formatOptions);
          } else if (format === 'markdown') {
            result = visualizationService.generateMarkdownExport(session, formatOptions);
          } else {
            continue;
          }
          
          results.push(result);
        }
        
        this.security.auditAction('generate_multiple_formats', session.id, {
          formats: formats.join(','),
          resultCount: results.length
        });

        return {
          success: true,
          data: results,
          metadata: {
            message: 'Multiple format visualizations generated successfully',
            formats: formats.join(', '),
            resultCount: results.length
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to generate multiple format visualizations: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Get supported visualization formats
   */
  public getSupportedFormats(): ToolResponse<{
    formats: Array<{ name: string; description: string; extensions: string[] }>;
    themes: string[];
  }> {
    try {
      const formats = [
        {
          name: 'mermaid',
          description: 'Interactive diagram format for visualizing session structure',
          extensions: ['.mmd', '.mermaid']
        },
        {
          name: 'json',
          description: 'Structured data export for programmatic processing',
          extensions: ['.json']
        },
        {
          name: 'markdown',
          description: 'Human-readable documentation format',
          extensions: ['.md', '.markdown']
        }
      ];

      const themes = ['default', 'dark', 'forest', 'neutral'];

      return {
        success: true,
        data: { formats, themes },
        metadata: {
          message: 'Supported formats retrieved successfully'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get supported formats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods
  private validateVisualizationOptions(options: VisualizationOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validFormats = ['mermaid', 'json', 'markdown'];
    if (!validFormats.includes(options.format)) {
      errors.push(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    if (options.maxDepth && (options.maxDepth < 1 || options.maxDepth > 50)) {
      errors.push('Max depth must be between 1 and 50');
    }

    if (options.theme && !['default', 'dark', 'forest', 'neutral'].includes(options.theme)) {
      warnings.push('Invalid theme specified, using default');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
