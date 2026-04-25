// Simple error logging utility for development
// In production, this should integrate with a monitoring service like Sentry, LogRocket, or custom logging

export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal"
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  timestamp: string;
  stack?: string;
}

const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 100;

export function logError(
  error: Error | unknown,
  context?: Record<string, unknown>,
  userId?: string
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const entry: LogEntry = {
    level: LogLevel.ERROR,
    message,
    context,
    userId,
    timestamp: new Date().toISOString(),
    stack
  };

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Console output for development
  console.error("[ERROR]", message, context, stack);

  // In production, send to monitoring service
  if (process.env.NODE_ENV === "production") {
    // Send to Sentry, DataDog, or similar
    // Example: Sentry.captureException(error, { extra: context });
  }
}

export function logWarn(message: string, context?: Record<string, unknown>, userId?: string) {
  const entry: LogEntry = {
    level: LogLevel.WARN,
    message,
    context,
    userId,
    timestamp: new Date().toISOString()
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  console.warn("[WARN]", message, context);
}

export function logInfo(message: string, context?: Record<string, unknown>, userId?: string) {
  const entry: LogEntry = {
    level: LogLevel.INFO,
    message,
    context,
    userId,
    timestamp: new Date().toISOString()
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  console.log("[INFO]", message, context);
}

export function getRecentLogs(count: number = 50): LogEntry[] {
  return logBuffer.slice(-count);
}

export function clearLogs() {
  logBuffer.length = 0;
}
