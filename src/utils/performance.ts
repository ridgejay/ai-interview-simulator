interface QuestionCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

export class QuestionCacheManager {
  private static cache: QuestionCache = {};
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 50;

  static generateCacheKey(difficulty: string, usedQuestionTypes: string[], weakAreas: string[]): string {
    return `${difficulty}_${usedQuestionTypes.sort().join(',')}_${weakAreas.sort().join(',')}`;
  }

  static get(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Clean old entries if cache is too large
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  static cleanup(): void {
    const now = Date.now();
    const entries = Object.entries(this.cache);
    
    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now > value.timestamp + value.ttl) {
        delete this.cache[key];
      }
    });

    // If still too large, remove oldest entries
    const remaining = Object.entries(this.cache);
    if (remaining.length >= this.MAX_CACHE_SIZE) {
      remaining
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, -this.MAX_CACHE_SIZE + 10) // Keep newest 40 entries
        .forEach(([key]) => delete this.cache[key]);
    }
  }

  static clear(): void {
    this.cache = {};
  }

  static getStats(): { size: number; oldest: number; newest: number } {
    const entries = Object.values(this.cache);
    if (entries.length === 0) {
      return { size: 0, oldest: 0, newest: 0 };
    }

    const timestamps = entries.map(e => e.timestamp);
    return {
      size: entries.length,
      oldest: Math.min(...timestamps),
      newest: Math.max(...timestamps)
    };
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: { [key: string]: number[] } = {};

  static startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  static recordMetric(operation: string, value: number): void {
    if (!this.metrics[operation]) {
      this.metrics[operation] = [];
    }
    
    this.metrics[operation].push(value);
    
    // Keep only last 100 measurements per operation
    if (this.metrics[operation].length > 100) {
      this.metrics[operation] = this.metrics[operation].slice(-100);
    }
  }

  static getMetrics(operation: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics[operation];
    if (!values || values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  static getAllMetrics(): { [key: string]: ReturnType<typeof PerformanceMonitor.getMetrics> } {
    const result: any = {};
    Object.keys(this.metrics).forEach(key => {
      result[key] = this.getMetrics(key);
    });
    return result;
  }

  static clearMetrics(): void {
    this.metrics = {};
  }
}

// Debounced function utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttled function utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitoring
export function getMemoryUsage(): { used: number; total: number; percentage: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }
  return null;
}

// Network connection monitoring
export function getConnectionInfo(): { type: string; downlink?: number; effectiveType?: string } | null {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      type: connection.type || 'unknown',
      downlink: connection.downlink,
      effectiveType: connection.effectiveType
    };
  }
  return null;
}