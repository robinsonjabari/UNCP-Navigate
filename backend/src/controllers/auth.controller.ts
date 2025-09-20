import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { AuthService } from "../services/auth.service"
import { ValidationUtils } from "../utils/validation"
import { PasswordUtils } from "../utils/password"
import { logger } from "../utils/logger"

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  /**
   * User registration
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        studentId,
        role = "student",
      } = req.body

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          message:
            "Missing required fields: email, password, firstName, lastName",
          error: "MISSING_REQUIRED_FIELDS",
        })
        return
      }

      // Validate email format
      if (!ValidationUtils.isValidEmail(email)) {
        res.status(400).json({
          message: "Invalid email format",
          error: "INVALID_EMAIL_FORMAT",
        })
        return
      }

      // Validate password strength
      const passwordValidation = ValidationUtils.validatePassword(password)
      if (!passwordValidation.isValid) {
        res.status(400).json({
          message: "Password does not meet requirements",
          error: "INVALID_PASSWORD",
          requirements: passwordValidation.errors,
        })
        return
      }

      // Validate role
      const validRoles = ["student", "faculty", "staff", "visitor"]
      if (!validRoles.includes(role)) {
        res.status(400).json({
          message: "Invalid role. Must be student, faculty, staff, or visitor",
          error: "INVALID_ROLE",
          validRoles,
        })
        return
      }

      // Check if user already exists
      const existingUser = await this.authService.getUserByEmail(email)
      if (existingUser) {
        res.status(409).json({
          message: "User with this email already exists",
          error: "USER_ALREADY_EXISTS",
        })
        return
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hashPassword(password)

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        studentId,
        role,
      }

      const user = await this.authService.createUser(userData)

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      )

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user

      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
        token,
      })

      logger.info("User registered successfully", {
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    } catch (error) {
      logger.error("Error during registration", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Registration failed",
        error: "REGISTRATION_ERROR",
      })
    }
  }

  /**
   * User login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
          error: "MISSING_CREDENTIALS",
        })
        return
      }

      // Validate email format
      if (!ValidationUtils.isValidEmail(email)) {
        res.status(400).json({
          message: "Invalid email format",
          error: "INVALID_EMAIL_FORMAT",
        })
        return
      }

      // Get user by email
      const user = await this.authService.getUserByEmail(email)
      if (!user) {
        res.status(401).json({
          message: "Invalid email or password",
          error: "INVALID_CREDENTIALS",
        })
        return
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        user.password
      )
      if (!isPasswordValid) {
        res.status(401).json({
          message: "Invalid email or password",
          error: "INVALID_CREDENTIALS",
        })
        return
      }

      // Update last login
      await this.authService.updateLastLogin(user.id)

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      )

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user

      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
      })

      logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email,
      })
    } catch (error) {
      logger.error("Error during login", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Login failed",
        error: "LOGIN_ERROR",
      })
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          error: "NOT_AUTHENTICATED",
        })
        return
      }

      const user = await this.authService.getUserById(userId)
      if (!user) {
        res.status(404).json({
          message: "User not found",
          error: "USER_NOT_FOUND",
        })
        return
      }

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user

      res.json({ user: userWithoutPassword })

      logger.info("User profile retrieved", { userId })
    } catch (error) {
      logger.error("Error retrieving user profile", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Failed to retrieve profile",
        error: "PROFILE_RETRIEVAL_ERROR",
      })
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const { firstName, lastName, studentId, preferences } = req.body

      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          error: "NOT_AUTHENTICATED",
        })
        return
      }

      // Validate at least one field is provided
      if (!firstName && !lastName && !studentId && !preferences) {
        res.status(400).json({
          message: "At least one field must be provided for update",
          error: "NO_UPDATE_FIELDS",
        })
        return
      }

      const updateData: any = {}
      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (studentId) updateData.studentId = studentId
      if (preferences) updateData.preferences = preferences

      const updatedUser = await this.authService.updateUser(userId, updateData)

      if (!updatedUser) {
        res.status(404).json({
          message: "User not found",
          error: "USER_NOT_FOUND",
        })
        return
      }

      // Return user data without password
      const { password: _, ...userWithoutPassword } = updatedUser

      res.json({
        message: "Profile updated successfully",
        user: userWithoutPassword,
      })

      logger.info("User profile updated", {
        userId,
        updatedFields: Object.keys(updateData),
      })
    } catch (error) {
      logger.error("Error updating user profile", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Failed to update profile",
        error: "PROFILE_UPDATE_ERROR",
      })
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const { currentPassword, newPassword } = req.body

      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          error: "NOT_AUTHENTICATED",
        })
        return
      }

      // Validate required fields
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          message: "Current password and new password are required",
          error: "MISSING_PASSWORDS",
        })
        return
      }

      // Validate new password strength
      const passwordValidation = ValidationUtils.validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        res.status(400).json({
          message: "New password does not meet requirements",
          error: "INVALID_NEW_PASSWORD",
          requirements: passwordValidation.errors,
        })
        return
      }

      // Get current user
      const user = await this.authService.getUserById(userId)
      if (!user) {
        res.status(404).json({
          message: "User not found",
          error: "USER_NOT_FOUND",
        })
        return
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordUtils.comparePassword(
        currentPassword,
        user.password
      )
      if (!isCurrentPasswordValid) {
        res.status(401).json({
          message: "Current password is incorrect",
          error: "INVALID_CURRENT_PASSWORD",
        })
        return
      }

      // Hash new password
      const hashedNewPassword = await PasswordUtils.hashPassword(newPassword)

      // Update password
      await this.authService.updatePassword(userId, hashedNewPassword)

      res.json({
        message: "Password changed successfully",
      })

      logger.info("User password changed", { userId })
    } catch (error) {
      logger.error("Error changing password", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Failed to change password",
        error: "PASSWORD_CHANGE_ERROR",
      })
    }
  }

  /**
   * Logout user (invalidate token)
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id

      if (userId) {
        // In a production app, you might want to blacklist the token
        // or store it in a redis cache for invalidation
        logger.info("User logged out", { userId })
      }

      res.json({
        message: "Logout successful",
      })
    } catch (error) {
      logger.error("Error during logout", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Logout failed",
        error: "LOGOUT_ERROR",
      })
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const userEmail = req.user?.email
      const userRole = req.user?.role

      if (!userId || !userEmail || !userRole) {
        res.status(401).json({
          message: "Invalid token data",
          error: "INVALID_TOKEN_DATA",
        })
        return
      }

      // Generate new JWT token
      const newToken = jwt.sign(
        {
          userId,
          email: userEmail,
          role: userRole,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      )

      res.json({
        message: "Token refreshed successfully",
        token: newToken,
      })

      logger.info("Token refreshed", { userId })
    } catch (error) {
      logger.error("Error refreshing token", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Failed to refresh token",
        error: "TOKEN_REFRESH_ERROR",
      })
    }
  }
}
