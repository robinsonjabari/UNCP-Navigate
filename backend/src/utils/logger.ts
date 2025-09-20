/**
 * Logger utility for structured logging
 */

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  metadata?: any
  requestId?: string
  userId?: string
  ip?: string
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv()
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase()
    switch (envLevel) {
      case "error":
        return LogLevel.ERROR
      case "warn":
        return LogLevel.WARN
      case "info":
        return LogLevel.INFO
      case "debug":
        return LogLevel.DEBUG
      default:
        return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ]
    return levels.indexOf(level) <= levels.indexOf(this.logLevel)
  }

  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(entry)
    }

    // Pretty format for development
    const timestamp = new Date(entry.timestamp).toLocaleString()
    const level = entry.level.toUpperCase().padEnd(5)
    let message = `[${timestamp}] ${level} ${entry.message}`

    if (entry.metadata) {
      message += "\n" + JSON.stringify(entry.metadata, null, 2)
    }

    return message
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: any,
    context?: any
  ): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      requestId: context?.requestId,
      userId: context?.userId,
      ip: context?.ip,
    }

    const formattedLog = this.formatLog(entry)

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.DEBUG:
        console.debug(formattedLog)
        break
    }

    // In production, you might want to send logs to external service
    if (process.env.NODE_ENV === "production" && level === LogLevel.ERROR) {
      this.sendToExternalLogging(entry)
    }
  }

  error(message: string, metadata?: any, context?: any): void {
    this.log(LogLevel.ERROR, message, metadata, context)
  }

  warn(message: string, metadata?: any, context?: any): void {
    this.log(LogLevel.WARN, message, metadata, context)
  }

  info(message: string, metadata?: any, context?: any): void {
    this.log(LogLevel.INFO, message, metadata, context)
  }

  debug(message: string, metadata?: any, context?: any): void {
    this.log(LogLevel.DEBUG, message, metadata, context)
  }

  // Log HTTP requests
  logRequest(req: any, res: any, duration: number): void {
    const entry = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
      contentLength: res.get("Content-Length"),
    }

    const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, "HTTP Request", entry, {
      requestId: req.id,
      userId: req.user?.id,
      ip: req.ip,
    })
  }

  // Log database queries
  logQuery(query: string, params: any[], duration: number): void {
    this.debug("Database Query", {
      query: query.replace(/\s+/g, " ").trim(),
      params,
      duration: `${duration}ms`,
    })
  }

  // Log authentication events
  logAuth(
    event: string,
    userId?: string,
    ip?: string,
    success: boolean = true
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    this.log(level, `Authentication: ${event}`, {
      userId,
      ip,
      success,
      timestamp: new Date().toISOString(),
    })
  }

  // Log security events
  logSecurity(event: string, details: any, ip?: string): void {
    this.warn(`Security Event: ${event}`, {
      ...details,
      ip,
      severity: "medium",
    })
  }

  private sendToExternalLogging(entry: LogEntry): void {
    // Placeholder for external logging service integration
    // e.g., Winston with external transports, Sentry, CloudWatch, etc.
    console.log("Would send to external logging:", entry)
  }
}

// Export singleton instance
export const logger = Logger.getInstance()
