import express, { Application, Request, Response, NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import compression from "compression"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

// Import routes
import indexRoutes from "./routes/index"
import authRoutes from "./routes/auth"
import placesRoutes from "./routes/places"
import routesRoutes from "./routes/routes"
import reportsRoutes from "./routes/reports"

// Import middleware
import { errorHandler } from "./middleware/errorHandler"
import { notFound } from "./middleware/notFound"

// Load environment variables
dotenv.config()

class App {
  public app: Application
  public port: number

  constructor() {
    this.app = express()
    this.port = parseInt(process.env.PORT || "3000", 10)

    this.initializeMiddleware()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      })
    )

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3001",
        credentials: process.env.CORS_CREDENTIALS === "true",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    )

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // limit each IP to 100 requests per windowMs
      message: {
        error: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
    this.app.use("/api/", limiter)

    // Compression
    this.app.use(compression())

    // Logging
    if (process.env.NODE_ENV === "development") {
      this.app.use(morgan("dev"))
    } else {
      this.app.use(morgan("combined"))
    }

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))

    // Trust proxy for rate limiting and IP detection
    this.app.set("trust proxy", 1)
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
      })
    })

    // API routes
    this.app.use("/api", indexRoutes)
    this.app.use("/api/auth", authRoutes)
    this.app.use("/api/places", placesRoutes)
    this.app.use("/api/routes", routesRoutes)
    this.app.use("/api/reports", reportsRoutes)

    // Serve static files in production
    if (process.env.NODE_ENV === "production") {
      this.app.use(express.static("public"))

      // Serve React app for all non-API routes
      this.app.get("*", (req: Request, res: Response) => {
        res.sendFile("index.html", { root: "public" })
      })
    }
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFound)

    // Global error handler
    this.app.use(errorHandler)
  }

  public listen(): void {
    this.app.listen(this.port, process.env.HOST || "0.0.0.0", () => {
      console.log(
        `🚀 UNCP Navigate API server running on http://${
          process.env.HOST || "0.0.0.0"
        }:${this.port}`
      )
      console.log(`📊 Environment: ${process.env.NODE_ENV}`)
      console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN}`)

      if (process.env.NODE_ENV === "development") {
        console.log(
          `📖 API Documentation: http://localhost:${this.port}/api/docs`
        )
      }
    })
  }

  public getApp(): Application {
    return this.app
  }
}

// Create and start the server
const app = new App()

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully")
  process.exit(0)
})

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("💥 Uncaught Exception:", err)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("💥 Unhandled Rejection at:", promise, "reason:", reason)
    process.exit(1)
  }
)

// Start the server
if (require.main === module) {
  app.listen()
}

export default app
