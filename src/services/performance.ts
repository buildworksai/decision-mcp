interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceStats {
  totalCalls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastCall: number;
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>();
  private stats = new Map<string, PerformanceStats>();
  private maxMetrics = 1000;

  startTiming(name: string, metadata?: Record<string, unknown>): string {
    const metricId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.set(metricId, {
      name,
      startTime: performance.now(),
      metadata
    });

    // Clean up old metrics if we have too many
    if (this.metrics.size > this.maxMetrics) {
      this.cleanupOldMetrics();
    }

    return metricId;
  }

  endTiming(metricId: string): number | null {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Update statistics
    this.updateStats(metric.name, duration);

    // Remove from active metrics
    this.metrics.delete(metricId);

    return duration;
  }

  getStats(name: string): PerformanceStats | null {
    return this.stats.get(name) || null;
  }

  getAllStats(): Record<string, PerformanceStats> {
    const result: Record<string, PerformanceStats> = {};
    for (const [name, stats] of this.stats) {
      result[name] = stats;
    }
    return result;
  }

  resetStats(name?: string): void {
    if (name) {
      this.stats.delete(name);
    } else {
      this.stats.clear();
    }
  }

  private updateStats(name: string, duration: number): void {
    const existing = this.stats.get(name);
    
    if (existing) {
      existing.totalCalls++;
      existing.averageDuration = (existing.averageDuration * (existing.totalCalls - 1) + duration) / existing.totalCalls;
      existing.minDuration = Math.min(existing.minDuration, duration);
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.lastCall = Date.now();
    } else {
      this.stats.set(name, {
        totalCalls: 1,
        averageDuration: duration,
        minDuration: duration,
        maxDuration: duration,
        lastCall: Date.now()
      });
    }
  }

  private cleanupOldMetrics(): void {
    const now = Date.now();
    const cutoff = now - 300000; // 5 minutes ago

    for (const [id, metric] of this.metrics) {
      if (metric.startTime < cutoff) {
        this.metrics.delete(id);
      }
    }
  }

  // Utility method to wrap async functions with performance monitoring
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
    const metricId = this.startTiming(name, metadata);
    try {
      const result = await fn();
      this.endTiming(metricId);
      return result;
    } catch (error) {
      this.endTiming(metricId);
      throw error;
    }
  }

  // Utility method to wrap sync functions with performance monitoring
  measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    const metricId = this.startTiming(name, metadata);
    try {
      const result = fn();
      this.endTiming(metricId);
      return result;
    } catch (error) {
      this.endTiming(metricId);
      throw error;
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance decorator for methods
export function measurePerformance(name?: string, metadata?: Record<string, unknown>): (target: unknown, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const method = descriptor.value;
    const metricName = name || `${(target as { constructor: { name: string } }).constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      return performanceMonitor.measureAsync(metricName, () => method.apply(this, args), metadata);
    };

    return descriptor;
  };
}
