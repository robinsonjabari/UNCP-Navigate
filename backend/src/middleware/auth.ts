import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import pool from "../db/pool"

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        firstName: string
        lastName: string
      }
    }
  }
}

export interface JwtPayload {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization")

    if (!authHeader) {
      res.status(401).json({
        message: "Access denied. No token provided.",
        error: "MISSING_TOKEN",
      })
      return
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader

    if (!token) {
      res.status(401).json({
        message: "Access denied. Invalid token format.",
        error: "INVALID_TOKEN_FORMAT",
      })
      return
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set")
      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_CONFIGURATION_ERROR",
      })
      return
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    // Get user from database to ensure they still exist and are active
    const userQuery =
      "SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1"
    const userResult = await pool.query(userQuery, [decoded.id])

    if (userResult.rows.length === 0) {
      res.status(401).json({
        message: "Access denied. User not found.",
        error: "USER_NOT_FOUND",
      })
      return
    }

    const user = userResult.rows[0]

    if (!user.is_active) {
      res.status(401).json({
        message: "Access denied. Account is deactivated.",
        error: "ACCOUNT_DEACTIVATED",
      })
      return
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    }

    // Update last login timestamp
    const updateLoginQuery = "UPDATE users SET last_login = NOW() WHERE id = $1"
    await pool.query(updateLoginQuery, [user.id])

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Access denied. Invalid token.",
        error: "INVALID_TOKEN",
      })
      return
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: "Access denied. Token expired.",
        error: "TOKEN_EXPIRED",
      })
      return
    }

    console.error("Authentication error:", error)
    res.status(500).json({
      message: "Internal server error during authentication",
      error: "AUTHENTICATION_ERROR",
    })
  }
}

/**
 * Middleware to authorize specific roles
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        message: "Access denied. Authentication required.",
        error: "AUTHENTICATION_REQUIRED",
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(
          " or "
        )}. Your role: ${req.user.role}`,
        error: "INSUFFICIENT_PERMISSIONS",
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      })
      return
    }

    next()
  }
}

/**
 * Optional authentication middleware - adds user if token is valid but doesn't require it
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization")

    if (!authHeader) {
      next()
      return
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader

    if (!token) {
      next()
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      next()
      return
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload
    const userQuery =
      "SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1"
    const userResult = await pool.query(userQuery, [decoded.id])

    if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
      const user = userResult.rows[0]
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      }
    }

    next()
  } catch (error) {
    // Silently continue without authentication for optional auth
    next()
  }
}

/**
 * Generate JWT token for user
 */
export const generateToken = (user: {
  id: string
  email: string
  role: string
}): string => {
  const jwtSecret = process.env.JWT_SECRET
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h"

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not set")
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: jwtExpiresIn,
      issuer: "uncp-navigate-api",
      audience: "uncp-navigate-client",
    } as any
  )
}

/**
 * Generate refresh token for user
 */
export const generateRefreshToken = (user: {
  id: string
  email: string
}): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d"

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set")
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: "refresh",
    },
    refreshSecret,
    {
      expiresIn: refreshExpiresIn,
      issuer: "uncp-navigate-api",
      audience: "uncp-navigate-client",
    } as any
  )
}

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (
  token: string
): { id: string; email: string } => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set")
  }

  const decoded = jwt.verify(token, refreshSecret) as any

  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type")
  }

  return {
    id: decoded.id,
    email: decoded.email,
  }
}

/**
 * Middleware to log authentication attempts
 */
export const logAuthAttempt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalSend = res.send

  res.send = function (body: any) {
    if (req.route && req.route.path.includes("auth")) {
      const logData = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
        method: req.method,
        success: res.statusCode < 400,
        statusCode: res.statusCode,
      }

      if (process.env.NODE_ENV === "development") {
        console.log("Auth attempt:", logData)
      }

      // In production, you might want to store this in a separate logging system
      // or database table for security monitoring
    }

    return originalSend.call(this, body)
  }

  next()
}
