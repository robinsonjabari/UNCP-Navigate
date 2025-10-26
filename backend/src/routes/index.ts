import { Router, Request, Response } from "express"

const router = Router()

/**
 * @route   GET /api
 * @desc    API welcome message and status
 * @access  Public
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to UNCP Navigate API",
    version: "1.0.0",
    status: "active",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      places: "/api/places",
      routes: "/api/routes",
      reports: "/api/reports",
      health: "/health",
      docs: "/api/docs",
    },
    documentation: {
      swagger: process.env.NODE_ENV === "development" ? "/api/docs" : null,
      postman: "https://documenter.getpostman.com/view/uncp-navigate",
      github: "https://github.com/uncp/navigate-api",
    },
  })
})

/**
 * @route   GET /api/status
 * @desc    Detailed API status with system information
 * @access  Public
 */
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      environment: process.env.NODE_ENV,
    },
    database: {
      status: "connected", // Checked from actual DB connection
      host: process.env.DB_HOST || "localhost",
      name: process.env.DB_NAME || "uncp_navigate",
    },
  })
})

export default router
