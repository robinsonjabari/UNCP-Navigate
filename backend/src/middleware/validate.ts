import { Request, Response, NextFunction } from "express"
import { validationResult, ValidationError } from "express-validator"

// Use Express.Multer types instead
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File
      files?:
        | Express.Multer.File[]
        | { [fieldname: string]: Express.Multer.File[] }
    }
  }
}

/**
 * Middleware to handle validation errors from express-validator
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: "path" in error ? error.path : error.type,
      message: error.msg,
      value: "value" in error ? error.value : undefined,
      location: "location" in error ? error.location : undefined,
    }))

    res.status(400).json({
      message: "Validation failed",
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    })
    return
  }

  next()
}

/**
 * Middleware to sanitize request data
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Sanitize common fields
  if (req.body) {
    // Trim string values
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim()
      }
    })

    // Remove empty string values (convert to null)
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === "") {
        req.body[key] = null
      }
    })
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = (req.query[key] as string).trim()
      }
    })
  }

  next()
}

/**
 * Middleware to validate content type for POST/PUT requests
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.get("Content-Type")

    if (!contentType || !contentType.includes("application/json")) {
      res.status(400).json({
        message: "Invalid content type. Expected application/json",
        received: contentType,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }

  next()
}

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { limit, offset } = req.query

  // Validate limit
  if (limit !== undefined) {
    const limitNum = Number(limit)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        message: "Invalid limit parameter. Must be a number between 1 and 100",
        received: limit,
        timestamp: new Date().toISOString(),
      })
      return
    }
    req.query.limit = limitNum.toString()
  }

  // Validate offset
  if (offset !== undefined) {
    const offsetNum = Number(offset)
    if (isNaN(offsetNum) || offsetNum < 0) {
      res.status(400).json({
        message: "Invalid offset parameter. Must be a non-negative number",
        received: offset,
        timestamp: new Date().toISOString(),
      })
      return
    }
    req.query.offset = offsetNum.toString()
  }

  next()
}

/**
 * Middleware to validate coordinate parameters
 */
export const validateCoordinates = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const validateCoord = (lat: any, lng: any, context: string) => {
    const latNum = Number(lat)
    const lngNum = Number(lng)

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      res.status(400).json({
        message: `Invalid latitude in ${context}. Must be a number between -90 and 90`,
        received: lat,
        timestamp: new Date().toISOString(),
      })
      return false
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      res.status(400).json({
        message: `Invalid longitude in ${context}. Must be a number between -180 and 180`,
        received: lng,
        timestamp: new Date().toISOString(),
      })
      return false
    }

    return true
  }

  // Validate coordinates in request body
  if (req.body) {
    if (req.body.coordinates) {
      if (
        !validateCoord(
          req.body.coordinates.lat,
          req.body.coordinates.lng,
          "coordinates"
        )
      ) {
        return
      }
    }

    if (req.body.origin) {
      if (!validateCoord(req.body.origin.lat, req.body.origin.lng, "origin")) {
        return
      }
    }

    if (req.body.destination) {
      if (
        !validateCoord(
          req.body.destination.lat,
          req.body.destination.lng,
          "destination"
        )
      ) {
        return
      }
    }

    if (req.body.waypoints && Array.isArray(req.body.waypoints)) {
      for (let i = 0; i < req.body.waypoints.length; i++) {
        const waypoint = req.body.waypoints[i]
        if (!validateCoord(waypoint.lat, waypoint.lng, `waypoint ${i}`)) {
          return
        }
      }
    }
  }

  // Validate coordinates in URL parameters
  if (req.params.lat && req.params.lng) {
    if (!validateCoord(req.params.lat, req.params.lng, "URL parameters")) {
      return
    }
  }

  // Validate coordinates in query parameters
  if (req.query.lat && req.query.lng) {
    if (!validateCoord(req.query.lat, req.query.lng, "query parameters")) {
      return
    }
  }

  next()
}

/**
 * Middleware to validate file uploads
 */
export const validateFileUpload = (
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/gif"],
  maxSize: number = 5 * 1024 * 1024 // 5MB
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      next()
      return
    }

    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : [req.file]
      : [req.file]

    for (const file of files) {
      if (!file) continue

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          message: "Invalid file type",
          allowed: allowedTypes,
          received: file.mimetype,
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check file size
      if (file.size > maxSize) {
        res.status(400).json({
          message: "File too large",
          maxSize: `${maxSize / (1024 * 1024)}MB`,
          received: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          timestamp: new Date().toISOString(),
        })
        return
      }
    }

    next()
  }
}

/**
 * Middleware to validate UUID parameters
 */
export const validateUUID = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuidParam = req.params[paramName]

    if (!uuidParam) {
      res.status(400).json({
        message: `Missing ${paramName} parameter`,
        timestamp: new Date().toISOString(),
      })
      return
    }

    // UUID v4 regex pattern
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(uuidParam)) {
      res.status(400).json({
        message: `Invalid ${paramName} format. Expected UUID v4`,
        received: uuidParam,
        timestamp: new Date().toISOString(),
      })
      return
    }

    next()
  }
}

/**
 * Middleware to validate date parameters
 */
export const validateDateRange = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { startDate, endDate } = req.query

  if (startDate) {
    const start = new Date(startDate as string)
    if (isNaN(start.getTime())) {
      res.status(400).json({
        message: "Invalid startDate format. Expected ISO 8601 date string",
        received: startDate,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }

  if (endDate) {
    const end = new Date(endDate as string)
    if (isNaN(end.getTime())) {
      res.status(400).json({
        message: "Invalid endDate format. Expected ISO 8601 date string",
        received: endDate,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)

    if (start >= end) {
      res.status(400).json({
        message: "startDate must be before endDate",
        startDate,
        endDate,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }

  next()
}

/**
 * Middleware to validate search parameters
 */
export const validateSearchParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { search, category } = req.query

  // Validate search term length
  if (search && typeof search === "string") {
    if (search.length < 2) {
      res.status(400).json({
        message: "Search term must be at least 2 characters long",
        received: search,
        timestamp: new Date().toISOString(),
      })
      return
    }

    if (search.length > 100) {
      res.status(400).json({
        message: "Search term must be less than 100 characters",
        received: search.length,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }

  // Validate category
  if (category && typeof category === "string") {
    const validCategories = [
      "academic",
      "administrative",
      "dining",
      "recreation",
      "residence",
      "parking",
      "other",
    ]
    if (!validCategories.includes(category)) {
      res.status(400).json({
        message: "Invalid category",
        allowed: validCategories,
        received: category,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }

  next()
}
