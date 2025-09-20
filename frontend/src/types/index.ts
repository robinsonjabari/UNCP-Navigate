// API Response Types - These match your backend API exactly
export interface ApiResponse<T = any> {
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  limit: number
}

// User Types - Match backend User interface
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  studentId?: string
  role: "student" | "faculty" | "staff" | "visitor"
  preferences?: UserPreferences
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme?: "light" | "dark"
  language?: string
  accessibilityMode?: boolean
  mapPreferences?: {
    defaultZoom?: number
    showAccessibilityFeatures?: boolean
    preferredRouteMode?: "walking" | "driving" | "cycling"
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  studentId?: string
  role?: "student" | "faculty" | "staff" | "visitor"
}

export interface AuthResponse {
  user: User
  token: string
  message: string
}

// Place Types - Match backend Place interface
export interface Place {
  id: string
  name: string
  description?: string
  type: PlaceType
  coordinates: Coordinates
  address?: string
  building?: string
  floor?: string
  room?: string
  accessibility: AccessibilityFeatures
  amenities: string[]
  hours?: OperatingHours
  contact?: ContactInfo
  images?: string[]
  tags: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type PlaceType =
  | "academic"
  | "administrative"
  | "dining"
  | "recreation"
  | "housing"
  | "parking"
  | "transportation"
  | "emergency"
  | "other"

export interface Coordinates {
  lat: number
  lng: number
  elevation?: number
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean
  elevatorAccess?: boolean
  rampAccess?: boolean
  accessibleParking?: boolean
  accessibleRestrooms?: boolean
  hearingLoop?: boolean
  brailleSignage?: boolean
  audioAnnouncements?: boolean
}

export interface OperatingHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
  holidays?: DayHours
}

export interface DayHours {
  open: string // HH:MM format
  close: string // HH:MM format
  closed?: boolean
}

export interface ContactInfo {
  phone?: string
  email?: string
  website?: string
}

// Route Types - Match backend Route interface
export interface Route {
  id?: string
  origin: Coordinates
  destination: Coordinates
  waypoints?: Coordinates[]
  distance: number // in meters
  duration: number // in minutes
  mode: RouteMode
  accessibility: boolean
  path: Coordinates[]
  instructions: RouteInstruction[]
  metadata?: RouteMetadata
}

export type RouteMode = "walking" | "driving" | "cycling"

export interface RouteInstruction {
  step: number
  instruction: string
  distance: number
  duration: number
  coordinates: Coordinates
  type: "start" | "turn" | "continue" | "arrive"
  direction?: "left" | "right" | "straight" | "slight_left" | "slight_right"
}

export interface RouteMetadata {
  elevationGain?: number
  surfaceType?: "paved" | "unpaved" | "mixed"
  difficulty?: "easy" | "moderate" | "difficult"
  weatherImpact?: "low" | "medium" | "high"
}

export interface CampusTour {
  id: string
  name: string
  description: string
  duration: number // in minutes
  stops: Place[]
  route: Route
  interests: string[]
  difficulty: "easy" | "moderate" | "difficult"
  accessibility: boolean
}

// Report Types - Match backend Report interface
export interface Report {
  id: string
  type: ReportType
  title: string
  description: string
  location: ReportLocation
  severity: ReportSeverity
  status: ReportStatus
  submittedBy: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type ReportType = "maintenance" | "safety" | "accessibility" | "other"
export type ReportSeverity = "low" | "medium" | "high" | "critical"
export type ReportStatus = "open" | "in_progress" | "resolved" | "closed"

export interface ReportLocation {
  coordinates?: Coordinates
  building?: string
  floor?: string
  room?: string
  description: string
}

export interface CreateReportRequest {
  type: ReportType
  title: string
  description: string
  location: ReportLocation
  severity?: ReportSeverity
}

export interface ReportFilters {
  status?: ReportStatus
  type?: ReportType
  severity?: ReportSeverity
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  type?: PlaceType
  accessibility?: boolean
  amenities?: string[]
  tags?: string[]
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// Navigation Types
export interface NavigationState {
  currentLocation?: Coordinates
  destination?: Place
  route?: Route
  isNavigating: boolean
  routeMode: RouteMode
  accessibilityMode: boolean
}

// Emergency Types
export interface EmergencyRoute {
  id: string
  type: "fire" | "medical" | "security" | "weather"
  routes: Route[]
  emergencyContacts: ContactInfo[]
  instructions: string[]
}

// API Request Types
export interface RouteRequest {
  origin: Coordinates
  destination: Coordinates
  mode?: RouteMode
  accessibility?: boolean
}

export interface OptimizeRouteRequest {
  waypoints: Coordinates[]
  mode?: RouteMode
}

export interface PlaceSearchRequest {
  query?: string
  type?: PlaceType
  bounds?: MapBounds
  accessibility?: boolean
  limit?: number
  offset?: number
}

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}
