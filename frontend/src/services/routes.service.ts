import { apiClient } from "./api"
import {
  Route,
  RouteRequest,
  OptimizeRouteRequest,
  CampusTour,
  EmergencyRoute,
  Coordinates,
} from "@/types"

/**
 * Routes Service
 * Handles all routing and navigation API calls
 * These methods correspond exactly to your backend routes routes
 */
export class RoutesService {
  /**
   * Calculate route between two points - POST /api/routes/directions
   */
  static async getDirections(
    routeData: RouteRequest
  ): Promise<{ route: Route }> {
    return apiClient.post<{ route: Route }>("/routes/directions", routeData)
  }

  /**
   * Optimize route for multiple waypoints - POST /api/routes/optimize
   */
  static async optimizeRoute(
    routeData: OptimizeRouteRequest
  ): Promise<{ route: Route }> {
    return apiClient.post<{ route: Route }>("/routes/optimize", routeData)
  }

  /**
   * Get accessibility-friendly route - GET /api/routes/accessibility
   */
  static async getAccessibilityRoute(params: {
    "origin.lat": number
    "origin.lng": number
    "destination.lat": number
    "destination.lng": number
  }): Promise<{ route: Route }> {
    return apiClient.get<{ route: Route }>("/routes/accessibility", params)
  }

  /**
   * Get emergency evacuation routes - GET /api/routes/emergency
   */
  static async getEmergencyRoutes(params: {
    "location.lat": number
    "location.lng": number
    type?: "fire" | "medical" | "security" | "weather"
  }): Promise<{ routes: EmergencyRoute[] }> {
    return apiClient.get<{ routes: EmergencyRoute[] }>(
      "/routes/emergency",
      params
    )
  }

  /**
   * Get campus tour routes - GET /api/routes/tours
   */
  static async getCampusTours(params?: {
    duration?: number
    interests?: string
  }): Promise<{ tours: CampusTour[] }> {
    return apiClient.get<{ tours: CampusTour[] }>("/routes/tours", params)
  }

  /**
   * Get real-time navigation updates - GET /api/routes/navigation/:routeId
   */
  static async getNavigationUpdates(routeId: string): Promise<{
    route: Route
    currentStep: number
    nextInstruction: string
    timeToDestination: number
  }> {
    return apiClient.get<{
      route: Route
      currentStep: number
      nextInstruction: string
      timeToDestination: number
    }>(`/routes/navigation/${routeId}`)
  }

  /**
   * Save route for later - POST /api/routes/save
   */
  static async saveRoute(routeData: {
    name: string
    route: Route
    description?: string
  }): Promise<{ message: string; routeId: string }> {
    return apiClient.post<{ message: string; routeId: string }>(
      "/routes/save",
      routeData
    )
  }

  /**
   * Get saved routes - GET /api/routes/saved
   */
  static async getSavedRoutes(): Promise<{
    routes: Array<{
      id: string
      name: string
      route: Route
      description?: string
      createdAt: Date
    }>
  }> {
    return apiClient.get<{
      routes: Array<{
        id: string
        name: string
        route: Route
        description?: string
        createdAt: Date
      }>
    }>("/routes/saved")
  }

  /**
   * Delete saved route - DELETE /api/routes/saved/:id
   */
  static async deleteSavedRoute(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/routes/saved/${id}`)
  }

  /**
   * Get route alternatives - POST /api/routes/alternatives
   */
  static async getRouteAlternatives(
    routeData: RouteRequest
  ): Promise<{ routes: Route[] }> {
    return apiClient.post<{ routes: Route[] }>(
      "/routes/alternatives",
      routeData
    )
  }

  /**
   * Report route issue - POST /api/routes/report
   */
  static async reportRouteIssue(issueData: {
    route: Route
    issue: string
    description: string
    location?: Coordinates
  }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/routes/report", issueData)
  }

  /**
   * Get parking route - POST /api/routes/parking
   */
  static async getParkingRoute(data: {
    destination: Coordinates
    vehicleType?: "car" | "motorcycle" | "bicycle"
    accessibilityNeeds?: boolean
  }): Promise<{ route: Route; parkingSpots: any[] }> {
    return apiClient.post<{ route: Route; parkingSpots: any[] }>(
      "/routes/parking",
      data
    )
  }

  /**
   * Get shuttle routes - GET /api/routes/shuttle
   */
  static async getShuttleRoutes(): Promise<{
    routes: Array<{
      id: string
      name: string
      stops: any[]
      schedule: any[]
      isActive: boolean
    }>
  }> {
    return apiClient.get<{
      routes: Array<{
        id: string
        name: string
        stops: any[]
        schedule: any[]
        isActive: boolean
      }>
    }>("/routes/shuttle")
  }

  /**
   * Get estimated travel time - POST /api/routes/time-estimate
   */
  static async getTimeEstimate(data: {
    origin: Coordinates
    destination: Coordinates
    mode?: "walking" | "driving" | "cycling"
    departureTime?: Date
  }): Promise<{
    walkingTime: number
    drivingTime?: number
    cyclingTime?: number
    shuttleTime?: number
  }> {
    return apiClient.post<{
      walkingTime: number
      drivingTime?: number
      cyclingTime?: number
      shuttleTime?: number
    }>("/routes/time-estimate", data)
  }
}

export default RoutesService
