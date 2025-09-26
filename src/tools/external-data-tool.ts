import { v4 as uuidv4 } from 'uuid';
import type { ToolResponse, ValidationResult } from '../types/index.js';
import { externalDataService, type ExternalDataRequest, type ExternalDataResponse } from '../services/external-data.js';
import { performanceMonitor } from '../services/performance.js';
import { createSecurityMiddleware } from '../services/security.js';

export interface ExternalDataAttachment {
  id: string;
  sessionId: string;
  sessionType: 'thinking' | 'decision';
  dataResponse: ExternalDataResponse;
  relevance: string;
  tags: string[];
  createdAt: Date;
}

export class ExternalDataTool {
  private attachments = new Map<string, ExternalDataAttachment>();
  private security = createSecurityMiddleware();

  /**
   * Fetch data from external sources
   */
  public async fetchExternalData(request: ExternalDataRequest): Promise<ToolResponse<ExternalDataResponse>> {
    return performanceMonitor.measureAsync('fetchExternalData', async () => {
      try {
        const result = await externalDataService.fetchData(request);
        
        this.security.auditAction('fetch_external_data', undefined, {
          sourceId: request.sourceId,
          method: request.method,
          endpoint: request.endpoint
        });

        return {
          success: true,
          data: result,
          metadata: {
            message: 'External data fetched successfully',
            cached: result.cached,
            sourceId: request.sourceId
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to fetch external data: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Fetch data from multiple sources
   */
  public async fetchMultipleSources(requests: ExternalDataRequest[]): Promise<ToolResponse<ExternalDataResponse[]>> {
    return performanceMonitor.measureAsync('fetchMultipleSources', async () => {
      try {
        const results = await externalDataService.fetchMultiple(requests);
        
        this.security.auditAction('fetch_multiple_external_data', undefined, {
          requestCount: requests.length,
          sourceIds: requests.map(r => r.sourceId)
        });

        return {
          success: true,
          data: results,
          metadata: {
            message: 'Multiple external data sources fetched successfully',
            totalSources: requests.length,
            successfulFetches: results.filter(r => r.status < 400).length
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to fetch multiple external data sources: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
  }

  /**
   * Attach external data to a session
   */
  public attachToSession(
    sessionId: string,
    sessionType: 'thinking' | 'decision',
    dataResponse: ExternalDataResponse,
    relevance: string,
    tags: string[] = []
  ): ToolResponse<ExternalDataAttachment> {
    try {
      const validation = this.validateAttachment(sessionId, relevance, tags);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const attachmentId = uuidv4();
      const attachment: ExternalDataAttachment = {
        id: attachmentId,
        sessionId,
        sessionType,
        dataResponse,
        relevance: this.security.validateInput(relevance, 'criteria'),
        tags: tags.map(tag => this.security.validateInput(tag, 'criteria')),
        createdAt: new Date()
      };

      this.attachments.set(attachmentId, attachment);

      this.security.auditAction('attach_external_data', sessionId, {
        attachmentId,
        sessionType,
        sourceId: dataResponse.sourceId,
        tags: tags.length
      });

      return {
        success: true,
        data: attachment,
        metadata: {
          message: 'External data attached to session successfully',
          sessionId,
          sessionType
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to attach external data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get external data attachments for a session
   */
  public getSessionAttachments(sessionId: string): ToolResponse<ExternalDataAttachment[]> {
    try {
      const attachments = Array.from(this.attachments.values())
        .filter(attachment => attachment.sessionId === sessionId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: attachments,
        metadata: {
          message: 'Session attachments retrieved successfully',
          sessionId,
          attachmentCount: attachments.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get session attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Remove external data attachment
   */
  public removeAttachment(attachmentId: string): ToolResponse<boolean> {
    try {
      const attachment = this.attachments.get(attachmentId);
      if (!attachment) {
        return {
          success: false,
          error: 'Attachment not found'
        };
      }

      this.attachments.delete(attachmentId);

      this.security.auditAction('remove_external_data', attachment.sessionId, {
        attachmentId,
        sessionType: attachment.sessionType
      });

      return {
        success: true,
        data: true,
        metadata: {
          message: 'Attachment removed successfully',
          attachmentId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove attachment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List available data sources
   */
  public listDataSources(): ToolResponse<Array<{ id: string; name: string; type: string; enabled: boolean }>> {
    try {
      const sources = externalDataService.listSources().map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        enabled: source.enabled
      }));

      return {
        success: true,
        data: sources,
        metadata: {
          message: 'Data sources listed successfully',
          totalSources: sources.length,
          enabledSources: sources.filter(s => s.enabled).length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list data sources: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get external data service statistics
   */
  public getServiceStats(): ToolResponse<{
    cacheStats: { size: number; entries: Array<{ key: string; expiresAt: number }> };
    requestHistory: number;
    totalAttachments: number;
  }> {
    try {
      const cacheStats = externalDataService.getCacheStats();
      const requestHistory = externalDataService.getRequestHistory().length;
      const totalAttachments = this.attachments.size;

      return {
        success: true,
        data: {
          cacheStats,
          requestHistory,
          totalAttachments
        },
        metadata: {
          message: 'Service statistics retrieved successfully'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get service statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods
  private validateAttachment(sessionId: string, relevance: string, tags: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!sessionId || sessionId.trim().length === 0) {
      errors.push('Session ID is required');
    }

    if (!relevance || relevance.trim().length === 0) {
      errors.push('Relevance description is required');
    }

    if (relevance && relevance.length > 500) {
      errors.push('Relevance description must be 500 characters or less');
    }

    if (tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    tags.forEach((tag, index) => {
      if (tag.length > 50) {
        errors.push(`Tag ${index + 1} must be 50 characters or less`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
