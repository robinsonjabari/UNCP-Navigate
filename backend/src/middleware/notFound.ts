import { Request, Response, NextFunction } from "express"

/**
 * 404 Not Found middleware
 */
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = {
    message: `Route ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    suggestions: getSuggestions(req.originalUrl),
  }

  res.status(404).json({ error })
}

/**
 * Get route suggestions for common typos
 */
function getSuggestions(path: string): string[] {
  const commonRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/places",
    "/api/routes/directions",
    "/api/reports/feedback",
    "/health",
  ]

  // Simple suggestion algorithm based on string similarity
  const suggestions = commonRoutes.filter((route) => {
    const similarity = calculateSimilarity(
      path.toLowerCase(),
      route.toLowerCase()
    )
    return similarity > 0.5 // 50% similarity threshold
  })

  return suggestions.slice(0, 3) // Return top 3 suggestions
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1.0
  }

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}
