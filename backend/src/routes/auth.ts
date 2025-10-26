import { Router, Request, Response } from "express"
import { body } from "express-validator"
import { validateRequest } from "../middleware/validate"
import {
  authenticate,
  generateToken,
  generateRefreshToken,
} from "../middleware/auth"
import bcrypt from "bcrypt"
import pool from "../db/pool"

const router = Router()

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
      ),
    body("firstName")
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("role")
      .optional()
      .isIn(["student", "faculty", "staff", "visitor"])
      .withMessage("Role must be one of: student, faculty, staff, visitor"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role = "visitor",
      } = req.body

      // Check if user already exists
      const existingUserQuery = "SELECT id FROM users WHERE email = $1"
      const existingUser = await pool.query(existingUserQuery, [email])

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          message: "User already exists",
          error: "USER_EXISTS",
        })
        return
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10)
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Insert new user
      const insertUserQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, first_name, last_name, role, created_at
      `
      const newUser = await pool.query(insertUserQuery, [
        email,
        passwordHash,
        firstName,
        lastName,
        role,
      ])

      const user = newUser.rows[0]

      // Generate tokens
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      })

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
      })

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at,
        },
        token,
        refreshToken,
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        message: "Internal server error",
        error: "REGISTRATION_FAILED",
      })
    }
  }
)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body

      // Get user from database
      const userQuery = `
        SELECT id, email, password_hash, first_name, last_name, role, is_active, email_verified
        FROM users 
        WHERE email = $1
      `
      const userResult = await pool.query(userQuery, [email])

      if (userResult.rows.length === 0) {
        res.status(401).json({
          message: "Invalid credentials",
          error: "INVALID_CREDENTIALS",
        })
        return
      }

      const user = userResult.rows[0]

      // Check if user is active
      if (!user.is_active) {
        res.status(401).json({
          message: "Account is disabled",
          error: "ACCOUNT_DISABLED",
        })
        return
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        res.status(401).json({
          message: "Invalid credentials",
          error: "INVALID_CREDENTIALS",
        })
        return
      }

      // Update last login
      const updateLoginQuery =
        "UPDATE users SET last_login = NOW() WHERE id = $1"
      await pool.query(updateLoginQuery, [user.id])

      // Generate tokens
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      })

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
      })

      res.json({
        message: "Login successful",
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        message: "Internal server error",
        error: "LOGIN_FAILED",
      })
    }
  }
)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate token
 * @access  Private
 */
router.post("/logout", authenticate, async (_req: Request, res: Response) => {
  try {
    // TODO: Implement logout logic (blacklist token)
    res.json({ message: "Logout successful" })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
})

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post(
  "/refresh",
  [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
    validateRequest,
  ],
  async (_req: Request, res: Response) => {
    try {
      // TODO: Implement token refresh logic
      res.json({
        message: "Token refreshed successfully",
        token: "new-jwt-token",
        refreshToken: "new-refresh-token",
      })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, async (_req: Request, res: Response) => {
  try {
    // TODO: Get user from database using req.user.id
    res.json({
      user: {
        id: "temp-id",
        email: "user@uncp.edu",
        firstName: "John",
        lastName: "Doe",
        role: "student",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
})

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/profile",
  [
    authenticate,
    body("firstName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      // TODO: Update user profile in database
      res.json({
        message: "Profile updated successfully",
        user: {
          id: "temp-id",
          email: "user@uncp.edu",
          firstName: req.body.firstName || "John",
          lastName: req.body.lastName || "Doe",
          role: "student",
        },
      })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    validateRequest,
  ],
  async (_req: Request, res: Response) => {
    try {
      // TODO: Implement password reset email logic
      res.json({ message: "Password reset email sent" })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

export default router
