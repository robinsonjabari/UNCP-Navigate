import { Request, Response, NextFunction } from "express"

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  console.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  })

  // Default error response
  let statusCode = 500
  let message = "Internal server error"
  let errorCode = "INTERNAL_ERROR"

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400
    message = "Validation failed"
    errorCode = "VALIDATION_ERROR"
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401
    message = "Unauthorized access"
    errorCode = "UNAUTHORIZED"
  } else if (error.name === "ForbiddenError") {
    statusCode = 403
    message = "Access forbidden"
    errorCode = "FORBIDDEN"
  } else if (error.name === "NotFoundError") {
    statusCode = 404
    message = "Resource not found"
    errorCode = "NOT_FOUND"
  } else if (error.message.includes("duplicate key")) {
    statusCode = 409
    message = "Resource already exists"
    errorCode = "DUPLICATE_RESOURCE"
  } else if (error.message.includes("foreign key")) {
    statusCode = 400
    message = "Invalid reference to related resource"
    errorCode = "INVALID_REFERENCE"
  }

  // Prepare error response
  const errorResponse: any = {
    error: {
      message,
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = error.stack
    errorResponse.error.details = error.message
  }

  // Send error response
  res.status(statusCode).json(errorResponse)
}

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
