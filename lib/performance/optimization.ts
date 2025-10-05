// Performance Optimization Utilities

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Batch multiple operations
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly processor: (items: T[]) => Promise<void>;

  constructor(
    processor: (items: T[]) => Promise<void>,
    batchSize = 10,
    batchDelay = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  add(item: T): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const items = [...this.batch];
    this.batch = [];

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    try {
      await this.processor(items);
    } catch (error) {
      console.error("Batch processing error:", error);
    }
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  ttl?: number
): T {
  const cache = new Map<string, { value: any; timestamp: number }>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached) {
      if (!ttl || Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }
      cache.delete(key);
    }

    const result = func(...args);
    cache.set(key, { value: result, timestamp: Date.now() });

    return result;
  }) as T;
}

/**
 * Lazy load module
 */
export async function lazyLoad<T>(
  loader: () => Promise<T>
): Promise<T> {
  return loader();
}

/**
 * Compress data for transmission
 */
export function compressData(data: any): string {
  // Simple JSON stringification
  // In production, use actual compression like gzip
  return JSON.stringify(data);
}

/**
 * Decompress data
 */
export function decompressData(compressed: string): any {
  return JSON.parse(compressed);
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  name: string,
  func: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await func();
    const duration = performance.now() - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}

/**
 * Create a pool of resources
 */
export class ResourcePool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private readonly factory: () => Promise<T>;
  private readonly maxSize: number;

  constructor(factory: () => Promise<T>, maxSize = 10) {
    this.factory = factory;
    this.maxSize = maxSize;
  }

  async acquire(): Promise<T> {
    if (this.available.length > 0) {
      const resource = this.available.pop()!;
      this.inUse.add(resource);
      return resource;
    }

    if (this.inUse.size < this.maxSize) {
      const resource = await this.factory();
      this.inUse.add(resource);
      return resource;
    }

    // Wait for a resource to become available
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.acquire();
  }

  release(resource: T): void {
    this.inUse.delete(resource);
    this.available.push(resource);
  }

  async destroy(): Promise<void> {
    this.available = [];
    this.inUse.clear();
  }
}
