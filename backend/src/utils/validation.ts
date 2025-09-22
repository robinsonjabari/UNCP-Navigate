/**
 * Validation utilities for common data validation tasks
 */

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Validate coordinates
   */
  static isValidCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !isNaN(lat) &&
      !isNaN(lng)
    )
  }

  /**
   * Validate phone number (US format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex =
      /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
    return phoneRegex.test(phone)
  }

  /**
   * Validate date string
   */
  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  /**
   * Validate time string (HH:MM format)
   */
  static isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
  }

  /**
   * Validate and sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== "string") {
      return ""
    }

    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters except hyphens
      .replace(/\s+/g, " ") // Normalize whitespace
      .substring(0, 100) // Limit length
  }

  /**
   * Validate pagination parameters
   */
  static validatePaginationParams(
    limit?: string | number,
    offset?: string | number
  ): {
    limit: number
    offset: number
    errors: string[]
  } {
    const errors: string[] = []
    let validatedLimit = 50 // default
    let validatedOffset = 0 // default

    // Validate limit
    if (limit !== undefined) {
      const limitNum = typeof limit === "string" ? parseInt(limit, 10) : limit
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push("Limit must be a number between 1 and 100")
      } else {
        validatedLimit = limitNum
      }
    }

    // Validate offset
    if (offset !== undefined) {
      const offsetNum =
        typeof offset === "string" ? parseInt(offset, 10) : offset
      if (isNaN(offsetNum) || offsetNum < 0) {
        errors.push("Offset must be a non-negative number")
      } else {
        validatedOffset = offsetNum
      }
    }

    return {
      limit: validatedLimit,
      offset: validatedOffset,
      errors,
    }
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: { mimetype: string; size: number },
    allowedTypes: string[] = ["image/jpeg", "image/png"],
    maxSize: number = 5 * 1024 * 1024 // 5MB
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(
        `File type ${
          file.mimetype
        } is not allowed. Allowed types: ${allowedTypes.join(", ")}`
      )
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(
        `File size ${(file.size / 1024 / 1024).toFixed(
          2
        )}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(
          2
        )}MB`
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate campus place category
   */
  static isValidPlaceCategory(category: string): boolean {
    const validCategories = [
      "academic",
      "administrative",
      "dining",
      "recreation",
      "residence",
      "parking",
      "other",
    ]
    return validCategories.includes(category)
  }

  /**
   * Validate user role
   */
  static isValidUserRole(role: string): boolean {
    const validRoles = ["student", "faculty", "staff", "visitor", "admin"]
    return validRoles.includes(role)
  }

  /**
   * Validate feedback type
   */
  static isValidFeedbackType(type: string): boolean {
    const validTypes = ["bug", "feature", "improvement", "general"]
    return validTypes.includes(type)
  }

  /**
   * Validate route mode
   */
  static isValidRouteMode(mode: string): boolean {
    const validModes = ["walking", "driving", "cycling"]
    return validModes.includes(mode)
  }

  /**
   * Validate rating (1-5 scale)
   */
  static isValidRating(rating: number): boolean {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate JSON string
   */
  static isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate operating hours format
   */
  static isValidOperatingHours(hours: {
    open: string
    close: string
  }): boolean {
    return (
      this.isValidTime(hours.open) &&
      this.isValidTime(hours.close) &&
      hours.open !== hours.close
    )
  }

  /**
   * Validate array of strings
   */
  static isValidStringArray(arr: any, maxLength: number = 50): boolean {
    return (
      Array.isArray(arr) &&
      arr.length <= maxLength &&
      arr.every(
        (item) =>
          typeof item === "string" && item.length > 0 && item.length <= 100
      )
    )
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number")
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
