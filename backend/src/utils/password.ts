/**
 * Password utilities for hashing and verification
 */
import bcrypt from "bcryptjs"

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS)
      return await bcrypt.hash(password, salt)
    } catch (error) {
      console.error("Error hashing password:", error)
      throw new Error("Failed to hash password")
    }
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.error("Error verifying password:", error)
      throw new Error("Failed to verify password")
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
    score: number
  } {
    const errors: string[] = []
    let score = 0

    // Check minimum length
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    } else {
      score += 1
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    } else {
      score += 1
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    } else {
      score += 1
    }

    // Check for number
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    } else {
      score += 1
    }

    // Check for special character
    if (!/[@$!%*?&]/.test(password)) {
      errors.push(
        "Password must contain at least one special character (@$!%*?&)"
      )
    } else {
      score += 1
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push("Password should not contain repeated characters")
      score -= 1
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.max(0, score),
    }
  }

  /**
   * Generate a random password
   */
  static generateRandomPassword(length: number = 12): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&"
    let password = ""

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    return password
  }
}
