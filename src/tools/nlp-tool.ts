import type { ToolResponse } from '../types/index.js';
import { nlpService, type KeywordAnalysis, type Summary, type SimilarityAnalysis } from '../services/nlp.js';
import { performanceMonitor } from '../services/performance.js';
import { createSecurityMiddleware } from '../services/security.js';

export class NLPTool {
  private security = createSecurityMiddleware();

  /**
   * Analyze keywords in text
   */
  public analyzeKeywords(text: string): ToolResponse<KeywordAnalysis> {
    return performanceMonitor.measure('analyzeKeywords', () => {
      try {
        const sanitizedText = this.security.validateInput(text, 'thought');
        const result = nlpService.analyzeKeywords(sanitizedText);
        
        this.security.auditAction('analyze_keywords', undefined, {
          textLength: sanitizedText.length,
          keywordCount: result.keywords.length
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Keyword analysis completed successfully',
            keywordCount: result.keywords.length,
            sentiment: result.sentiment
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to analyze keywords: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Generate text summary
   */
  public generateSummary(text: string, maxLength: number = 200): ToolResponse<Summary> {
    return performanceMonitor.measure('generateSummary', () => {
      try {
        const sanitizedText = this.security.validateInput(text, 'thought');
        const result = nlpService.generateSummary(sanitizedText, maxLength);
        
        this.security.auditAction('generate_summary', undefined, {
          originalLength: sanitizedText.length,
          summaryLength: result.summary.length,
          compressionRatio: result.compressionRatio
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Summary generated successfully',
            originalWordCount: result.wordCount,
            compressionRatio: result.compressionRatio
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Analyze similarity between two texts
   */
  public analyzeSimilarity(text1: string, text2: string): ToolResponse<SimilarityAnalysis> {
    return performanceMonitor.measure('analyzeSimilarity', () => {
      try {
        const sanitizedText1 = this.security.validateInput(text1, 'thought');
        const sanitizedText2 = this.security.validateInput(text2, 'thought');
        const result = nlpService.analyzeSimilarity(sanitizedText1, sanitizedText2);
        
        this.security.auditAction('analyze_similarity', undefined, {
          text1Length: sanitizedText1.length,
          text2Length: sanitizedText2.length,
          similarity: result.similarity
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Similarity analysis completed successfully',
            similarity: result.similarity,
            commonWordsCount: result.commonWords.length
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to analyze similarity: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Extract entities from text
   */
  public extractEntities(text: string): ToolResponse<Array<{ text: string; type: string }>> {
    return performanceMonitor.measure('extractEntities', () => {
      try {
        const sanitizedText = this.security.validateInput(text, 'thought');
        const result = nlpService.extractEntities(sanitizedText);
        
        this.security.auditAction('extract_entities', undefined, {
          textLength: sanitizedText.length,
          entityCount: result.length
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Entity extraction completed successfully',
            entityCount: result.length,
            entityTypes: [...new Set(result.map(e => e.type))]
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to extract entities: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Classify text into categories
   */
  public classifyText(text: string): ToolResponse<Array<{ category: string; confidence: number }>> {
    return performanceMonitor.measure('classifyText', () => {
      try {
        const sanitizedText = this.security.validateInput(text, 'thought');
        const result = nlpService.classifyText(sanitizedText);
        
        this.security.auditAction('classify_text', undefined, {
          textLength: sanitizedText.length,
          categoryCount: result.length
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'Text classification completed successfully',
            categoryCount: result.length,
            topCategory: result[0]?.category
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to classify text: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Analyze session content with NLP
   */
  public analyzeSessionContent(session: Record<string, unknown>): ToolResponse<{
    overallSentiment: 'positive' | 'negative' | 'neutral';
    keyTopics: string[];
    summary: string;
    entities: Array<{ text: string; type: string }>;
    categories: Array<{ category: string; confidence: number }>;
  }> {
    return performanceMonitor.measure('analyzeSessionContent', () => {
      try {
        let combinedText = '';
        
        if ('criteria' in session) {
          // Decision session
          combinedText = session.context + ' ';
          (session.criteria as Array<{ name: string; description: string }>).forEach((c) => {
            combinedText += c.name + ' ' + c.description + ' ';
          });
          (session.options as Array<{ name: string; description: string }>).forEach((o) => {
            combinedText += o.name + ' ' + o.description + ' ';
          });
        } else {
          // Thinking session
          combinedText = session.problem + ' ';
          (session.thoughts as Array<{ content: string }>).forEach((thought) => {
            combinedText += thought.content + ' ';
          });
          if (session.conclusion) {
            combinedText += session.conclusion + ' ';
          }
        }

        const sanitizedText = this.security.validateInput(combinedText, 'thought');
        
        // Perform various NLP analyses
        const keywordAnalysis = nlpService.analyzeKeywords(sanitizedText);
        const summary = nlpService.generateSummary(sanitizedText, 300);
        const entities = nlpService.extractEntities(sanitizedText);
        const categories = nlpService.classifyText(sanitizedText);
        
        this.security.auditAction('analyze_session_content', session.id as string, {
          sessionType: 'criteria' in session ? 'decision' : 'thinking',
          textLength: sanitizedText.length,
          keywordCount: keywordAnalysis.keywords.length,
          entityCount: entities.length
        });

        return {
          success: true,
          data: {
            overallSentiment: keywordAnalysis.sentiment,
            keyTopics: keywordAnalysis.keyPhrases.slice(0, 10),
            summary: summary.summary,
            entities,
            categories
          },
          metadata: {
            message: 'Session content analysis completed successfully',
            sentiment: keywordAnalysis.sentiment,
            keyTopicCount: keywordAnalysis.keyPhrases.length,
            entityCount: entities.length
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to analyze session content: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Compare multiple sessions
   */
  public compareSessions(sessions: Record<string, unknown>[]): ToolResponse<{
    similarities: Array<{ session1: string; session2: string; similarity: number }>;
    commonTopics: string[];
    overallSentiment: 'positive' | 'negative' | 'neutral';
  }> {
    return performanceMonitor.measure('compareSessions', () => {
      try {
        if (sessions.length < 2) {
          return {
            success: false,
            error: 'At least 2 sessions required for comparison'
          };
        }

        // Extract text from each session
        const sessionTexts = sessions.map(session => {
          let text = '';
          if ('criteria' in session) {
            text = session.context + ' ';
            (session.criteria as Array<{ name: string; description: string }>).forEach((c) => {
              text += c.name + ' ' + c.description + ' ';
            });
          } else {
            text = session.problem + ' ';
            (session.thoughts as Array<{ content: string }>).forEach((thought) => {
              text += thought.content + ' ';
            });
          }
          return this.security.validateInput(text, 'thought');
        });

        // Calculate pairwise similarities
        const similarities: Array<{ session1: string; session2: string; similarity: number }> = [];
        for (let i = 0; i < sessions.length; i++) {
          for (let j = i + 1; j < sessions.length; j++) {
            const similarity = nlpService.analyzeSimilarity(sessionTexts[i], sessionTexts[j]);
            similarities.push({
              session1: sessions[i].id as string,
              session2: sessions[j].id as string,
              similarity: similarity.similarity
            });
          }
        }

        // Find common topics across all sessions
        const allKeywords = sessionTexts.map(text => nlpService.analyzeKeywords(text));
        const commonTopics = this.findCommonTopics(allKeywords);

        // Calculate overall sentiment
        const combinedText = sessionTexts.join(' ');
        const overallSentiment = nlpService.analyzeKeywords(combinedText).sentiment;

        this.security.auditAction('compare_sessions', undefined, {
          sessionCount: sessions.length,
          similarityCount: similarities.length,
          commonTopicCount: commonTopics.length
        });

        return {
          success: true,
          data: {
            similarities,
            commonTopics,
            overallSentiment
          },
          metadata: {
            message: 'Session comparison completed successfully',
            sessionCount: sessions.length,
            similarityCount: similarities.length,
            commonTopicCount: commonTopics.length
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to compare sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  // Private helper methods
  private findCommonTopics(keywordAnalyses: KeywordAnalysis[]): string[] {
    if (keywordAnalyses.length === 0) return [];

    const topicCounts = new Map<string, number>();
    
    keywordAnalyses.forEach(analysis => {
      analysis.keyPhrases.forEach(phrase => {
        topicCounts.set(phrase, (topicCounts.get(phrase) || 0) + 1);
      });
    });

    // Return topics that appear in at least half of the sessions
    const threshold = Math.ceil(keywordAnalyses.length / 2);
    return Array.from(topicCounts.entries())
      .filter(([, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 10);
  }
}
