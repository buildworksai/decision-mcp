import fetch, { RequestInit as NodeFetchRequestInit } from 'node-fetch';
import { z } from 'zod';

// Validation schemas
const ExternalDataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  type: z.enum(['rest', 'json', 'csv']),
  headers: z.record(z.string()).optional(),
  timeout: z.number().min(1000).max(30000).default(10000),
  cacheTtl: z.number().min(60).max(3600).default(300), // 5 minutes default
  enabled: z.boolean().default(true)
});

const ExternalDataRequestSchema = z.object({
  sourceId: z.string(),
  endpoint: z.string().optional(),
  params: z.record(z.string()).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  body: z.unknown().optional(),
  headers: z.record(z.string()).optional()
});

const ExternalDataResponseSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  url: z.string(),
  method: z.string(),
  status: z.number(),
  headers: z.record(z.string()),
  data: z.unknown(),
  timestamp: z.date(),
  cached: z.boolean()
});

export type ExternalDataSource = z.infer<typeof ExternalDataSourceSchema>;
export type ExternalDataRequest = z.infer<typeof ExternalDataRequestSchema>;
export type ExternalDataResponse = z.infer<typeof ExternalDataResponseSchema>;

interface CacheEntry {
  data: ExternalDataResponse;
  expiresAt: number;
}

export class ExternalDataService {
  private sources = new Map<string, ExternalDataSource>();
  private cache = new Map<string, CacheEntry>();
  private requestHistory: ExternalDataResponse[] = [];

  constructor() {
    // Initialize with some common data sources
    this.initializeDefaultSources();
    
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 300000);
  }

  private initializeDefaultSources(): void {
    // Example: Weather API
    this.addSource({
      id: 'openweather',
      name: 'OpenWeatherMap',
      url: 'https://api.openweathermap.org/data/2.5',
      type: 'rest',
      headers: {
        'User-Agent': 'Decision-MCP/2.4.0'
      },
      timeout: 10000,
      cacheTtl: 600, // 10 minutes for weather data
      enabled: true
    });

    // Example: News API
    this.addSource({
      id: 'newsapi',
      name: 'News API',
      url: 'https://newsapi.org/v2',
      type: 'rest',
      headers: {
        'User-Agent': 'Decision-MCP/2.4.0'
      },
      timeout: 10000,
      cacheTtl: 300, // 5 minutes for news
      enabled: true
    });

    // Example: Financial data
    this.addSource({
      id: 'alphavantage',
      name: 'Alpha Vantage',
      url: 'https://www.alphavantage.co/query',
      type: 'rest',
      headers: {
        'User-Agent': 'Decision-MCP/2.4.0'
      },
      timeout: 15000,
      cacheTtl: 900, // 15 minutes for financial data
      enabled: true
    });
  }

  addSource(source: ExternalDataSource): void {
    const validated = ExternalDataSourceSchema.parse(source);
    this.sources.set(validated.id, validated);
  }

  removeSource(sourceId: string): boolean {
    return this.sources.delete(sourceId);
  }

  getSource(sourceId: string): ExternalDataSource | null {
    return this.sources.get(sourceId) || null;
  }

  listSources(): ExternalDataSource[] {
    return Array.from(this.sources.values());
  }

  async fetchData(request: ExternalDataRequest): Promise<ExternalDataResponse> {
    const validatedRequest = ExternalDataRequestSchema.parse(request);
    const source = this.sources.get(validatedRequest.sourceId);
    
    if (!source) {
      throw new Error(`Data source '${validatedRequest.sourceId}' not found`);
    }

    if (!source.enabled) {
      throw new Error(`Data source '${validatedRequest.sourceId}' is disabled`);
    }

    // Build URL
    const baseUrl = source.url;
    const endpoint = validatedRequest.endpoint || '';
    const url = new URL(endpoint, baseUrl);
    
    // Add query parameters
    if (validatedRequest.params) {
      Object.entries(validatedRequest.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(validatedRequest);
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      return {
        ...cached.data,
        cached: true
      };
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'User-Agent': 'Decision-MCP/2.4.0',
      'Accept': 'application/json',
      ...source.headers,
      ...validatedRequest.headers
    };

    // Prepare request options
    const options: NodeFetchRequestInit = {
      method: validatedRequest.method,
      headers
    };

    if (validatedRequest.body && ['POST', 'PUT'].includes(validatedRequest.method)) {
      options.body = JSON.stringify(validatedRequest.body) as string;
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url.toString(), options);
      const data = await response.json();

      const result: ExternalDataResponse = {
        id: `${validatedRequest.sourceId}_${Date.now()}`,
        sourceId: validatedRequest.sourceId,
        url: url.toString(),
        method: validatedRequest.method,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        timestamp: new Date(),
        cached: false
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + (source.cacheTtl * 1000)
      });

      // Add to history
      this.requestHistory.push(result);
      if (this.requestHistory.length > 1000) {
        this.requestHistory = this.requestHistory.slice(-1000);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to fetch data from ${validatedRequest.sourceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchMultiple(requests: ExternalDataRequest[]): Promise<ExternalDataResponse[]> {
    const promises = requests.map(request => this.fetchData(request));
    return Promise.allSettled(promises).then(results => 
      results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Return error response
          return {
            id: `error_${Date.now()}_${index}`,
            sourceId: requests[index].sourceId,
            url: '',
            method: requests[index].method,
            status: 500,
            headers: {},
            data: { error: result.reason.message },
            timestamp: new Date(),
            cached: false
          };
        }
      })
    );
  }

  getRequestHistory(limit: number = 100): ExternalDataResponse[] {
    return this.requestHistory.slice(-limit);
  }

  getCacheStats(): { size: number; entries: Array<{ key: string; expiresAt: number }> } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        expiresAt: entry.expiresAt
      }))
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  private generateCacheKey(request: ExternalDataRequest): string {
    return `${request.sourceId}:${request.method}:${request.endpoint || ''}:${JSON.stringify(request.params || {})}:${JSON.stringify(request.body || {})}`;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const externalDataService = new ExternalDataService();
