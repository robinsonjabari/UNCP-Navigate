// Common API response types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
    totalPages: number
    currentPage: number
  }
}

export interface ErrorResponse {
  error: {
    message: string
    code: string
    timestamp: string
    path?: string
    method?: string
    details?: any
    stack?: string // Only in development
  }
}

// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export type UserRole = "student" | "faculty" | "staff" | "visitor" | "admin"

export interface CreateUserRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: Omit<User, "createdAt" | "updatedAt">
  token: string
  refreshToken: string
  expiresIn: string
}

// Place types
export interface Coordinates {
  lat: number
  lng: number
}

export interface Place {
  id: string
  name: string
  description: string
  category: PlaceCategory
  coordinates: Coordinates
  address: string
  hours?: {
    open: string
    close: string
  }
  amenities?: string[]
  accessibility: boolean
  images?: string[]
  floorPlans?: string[]
  reviews?: {
    average: number
    count: number
  }
  createdAt: Date
  updatedAt: Date
}

export type PlaceCategory =
  | "academic"
  | "administrative"
  | "dining"
  | "recreation"
  | "residence"
  | "parking"
  | "other"

export interface CreatePlaceRequest {
  name: string
  description: string
  category: PlaceCategory
  coordinates: Coordinates
  address: string
  hours?: {
    open: string
    close: string
  }
  amenities?: string[]
  accessibility?: boolean
  images?: string[]
  floorPlans?: string[]
}

// Route types
export interface RouteRequest {
  origin: Coordinates
  destination: Coordinates
  mode?: RouteMode
  accessibility?: boolean
}

export type RouteMode = "walking" | "driving" | "cycling"

export interface RouteStep {
  instruction: string
  distance: number // in meters
  duration: number // in seconds
  coordinates: Coordinates[]
  maneuver?: {
    type: "turn" | "continue" | "arrive" | "depart"
    modifier?:
      | "left"
      | "right"
      | "sharp-left"
      | "sharp-right"
      | "slight-left"
      | "slight-right"
      | "straight"
  }
}

export interface Route {
  origin: Coordinates
  destination: Coordinates
  mode: RouteMode
  accessibility: boolean
  distance: number // in meters
  duration: number // in seconds
  steps: RouteStep[]
  polyline: string
  bounds: {
    northeast: Coordinates
    southwest: Coordinates
  }
  warnings?: string[]
  alternativeEntrances?: {
    building: string
    entrance: string
    coordinates: Coordinates
  }[]
}

// Feedback types
export interface Feedback {
  id: string
  userId?: string
  type: FeedbackType
  subject: string
  message: string
  email?: string
  rating?: number
  status: FeedbackStatus
  adminNotes?: string
  resolvedBy?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type FeedbackType = "bug" | "feature" | "improvement" | "general"
export type FeedbackStatus = "pending" | "reviewed" | "resolved"

export interface CreateFeedbackRequest {
  type: FeedbackType
  subject: string
  message: string
  email?: string
  rating?: number
}

// Analytics types
export interface UsageStatistics {
  period: "day" | "week" | "month" | "year"
  totalUsers: number
  totalSearches: number
  totalRoutes: number
  popularDestinations: {
    name: string
    visits: number
  }[]
  peakHours: {
    hour: number
    requests: number
  }[]
  userTypes: Record<UserRole, number>
  deviceTypes: {
    mobile: number
    desktop: number
    tablet: number
  }
}

// Search types
export interface SearchQuery {
  term?: string
  category?: PlaceCategory
  coordinates?: Coordinates
  radius?: number // in kilometers
  accessibility?: boolean
  limit?: number
  offset?: number
}

export interface SearchResult<T> {
  results: T[]
  total: number
  query: SearchQuery
  suggestions?: string[]
}

// Authentication types
export interface JwtPayload {
  id: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  id: string
  email: string
  type: "refresh"
  iat: number
  exp: number
}

// Database types
export interface DbConnection {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
}

// Configuration types
export interface AppConfig {
  port: number
  host: string
  nodeEnv: string
  database: DbConnection
  jwt: {
    secret: string
    expiresIn: string
    refreshSecret: string
    refreshExpiresIn: string
  }
  cors: {
    origin: string
    credentials: boolean
  }
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
  upload: {
    maxFileSize: number
    allowedTypes: string[]
  }
}

// Event types for real-time features
export interface CampusEvent {
  id: string
  title: string
  description: string
  locationId: string
  startTime: Date
  endTime: Date
  eventType: string
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Emergency types
export interface EmergencyContact {
  id: string
  serviceName: string
  phone: string
  description: string
  isPrimary: boolean
  isActive: boolean
}

export interface EmergencyRoute {
  primaryRoute: {
    destination: string
    coordinates: Coordinates
    distance: number
    duration: number
    instructions: string[]
  }
  alternativeRoutes: {
    destination: string
    coordinates: Coordinates
    distance: number
    duration: number
  }[]
  emergencyContacts: EmergencyContact[]
}

// Tour types
export interface TourStop {
  id: string
  name: string
  duration: number // minutes
  description: string
  coordinates?: Coordinates
}

export interface TourRoute {
  id: string
  name: string
  duration: number // minutes
  distance: number // kilometers
  description: string
  stops: TourStop[]
  polyline?: string
}

// Visit tracking types
export interface PlaceVisit {
  id: string
  userId?: string
  placeId: string
  visitType: "view" | "navigate" | "arrive"
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

// API usage tracking types
export interface ApiUsage {
  id: string
  userId?: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number // milliseconds
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  createdAt: Date
}
