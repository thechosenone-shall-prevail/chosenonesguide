// Error Tracking and Monitoring

export interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorTracker {
  private readonly environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || "development";
  }

  /**
   * Track an error
   */
  trackError(error: Error, context?: ErrorContext): void {
    console.error("[Error Tracker]", {
      message: error.message,
      stack: error.stack,
      context,
      environment: this.environment,
      timestamp: new Date().toISOString(),
    });

    // In production, send to error tracking service (e.g., Sentry)
    if (this.environment === "production") {
      this.sendToSentry(error, context);
    }
  }

  /**
   * Track a warning
   */
  trackWarning(message: string, context?: ErrorContext): void {
    console.warn("[Warning]", {
      message,
      context,
      environment: this.environment,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, context?: ErrorContext): void {
    console.log("[Performance]", {
      metric,
      value,
      context,
      timestamp: new Date().toISOString(),
    });

    // In production, send to monitoring service
    if (this.environment === "production") {
      this.sendToMonitoring(metric, value, context);
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, context?: ErrorContext): void {
    console.log("[Action]", {
      action,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create error boundary
   */
  createErrorBoundary<T>(
    func: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T> {
    return func().catch((error) => {
      this.trackError(error, context);
      throw error;
    });
  }

  // Private methods for external services

  private sendToSentry(error: Error, context?: ErrorContext): void {
    // Placeholder for Sentry integration
    // import * as Sentry from "@sentry/nextjs";
    // Sentry.captureException(error, { contexts: { custom: context } });
  }

  private sendToMonitoring(
    metric: string,
    value: number,
    context?: ErrorContext
  ): void {
    // Placeholder for monitoring service integration
    // e.g., DataDog, New Relic, etc.
  }
}

// Singleton instance
let errorTrackerInstance: ErrorTracker | null = null;

export function getErrorTracker(): ErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new ErrorTracker();
  }
  return errorTrackerInstance;
}

/**
 * Global error handler
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      getErrorTracker().trackError(event.error, {
        action: "window_error",
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      getErrorTracker().trackError(
        new Error(event.reason),
        {
          action: "unhandled_rejection",
        }
      );
    });
  }
}
