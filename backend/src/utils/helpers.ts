/**
 * Utility functions for common operations
 */

export class Utils {
  /**
   * Generate a random string of specified length
   */
  static generateRandomString(length: number = 32): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
  }

  /**
   * Generate a UUID v4
   */
  static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      }
    )
  }

  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item)) as any
    }

    if (typeof obj === "object") {
      const cloned: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key])
        }
      }
      return cloned
    }

    return obj
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  /**
   * Format duration in milliseconds to human readable string
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Convert radians to degrees
   */
  static toDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  }

  /**
   * Capitalize first letter of string
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   * Convert string to title case
   */
  static toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }

  /**
   * Truncate string to specified length
   */
  static truncate(str: string, length: number, suffix: string = "..."): string {
    if (str.length <= length) return str
    return str.substring(0, length - suffix.length) + suffix
  }

  /**
   * Remove duplicates from array
   */
  static uniqueArray<T>(arr: T[]): T[] {
    return [...new Set(arr)]
  }

  /**
   * Group array by key
   */
  static groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce((groups: Record<string, T[]>, item: T) => {
      const groupKey = String(item[key])
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    }, {})
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: any): boolean {
    if (obj == null) return true
    if (Array.isArray(obj) || typeof obj === "string") return obj.length === 0
    if (obj instanceof Map || obj instanceof Set) return obj.size === 0
    return Object.keys(obj).length === 0
  }

  /**
   * Pick specific properties from object
   */
  static pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>
    keys.forEach((key) => {
      if (key in obj) {
        result[key] = obj[key]
      }
    })
    return result
  }

  /**
   * Omit specific properties from object
   */
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj }
    keys.forEach((key) => {
      delete result[key]
    })
    return result
  }

  /**
   * Retry async function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let attempt = 1

    while (attempt <= maxAttempts) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }

        const delay = baseDelay * Math.pow(2, attempt - 1)
        await this.sleep(delay)
        attempt++
      }
    }

    throw new Error("Maximum retry attempts exceeded")
  }

  /**
   * Create a promise that times out
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out")), ms)
      ),
    ])
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: any): any {
    const sensitiveKeys = ["password", "token", "secret", "key", "auth"]

    if (typeof data !== "object" || data === null) {
      return data
    }

    const masked = { ...data }

    for (const key in masked) {
      if (
        typeof key === "string" &&
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        masked[key] = "***MASKED***"
      } else if (typeof masked[key] === "object") {
        masked[key] = this.maskSensitiveData(masked[key])
      }
    }

    return masked
  }
}
