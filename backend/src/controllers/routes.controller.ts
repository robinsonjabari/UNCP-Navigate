import { Request, Response } from "express"
import { RoutingService } from "../services/routing.service"
import { ValidationUtils } from "../utils/validation"
import { logger } from "../utils/logger"

export class RoutesController {
  private routingService: RoutingService

  constructor() {
    this.routingService = new RoutingService()
  }

  /**
   * Calculate route between two points
   */
  async getDirections(req: Request, res: Response): Promise<void> {
    try {
      const {
        origin,
        destination,
        mode = "walking",
        accessibility = false,
      } = req.body

      // Validate origin coordinates
      if (
        !origin ||
        !ValidationUtils.isValidCoordinates(origin.lat, origin.lng)
      ) {
        res.status(400).json({
          message: "Invalid origin coordinates",
          error: "INVALID_ORIGIN_COORDINATES",
        })
        return
      }

      // Validate destination coordinates
      if (
        !destination ||
        !ValidationUtils.isValidCoordinates(destination.lat, destination.lng)
      ) {
        res.status(400).json({
          message: "Invalid destination coordinates",
          error: "INVALID_DESTINATION_COORDINATES",
        })
        return
      }

      // Validate mode
      if (!ValidationUtils.isValidRouteMode(mode)) {
        res.status(400).json({
          message: "Invalid route mode. Must be walking, driving, or cycling",
          error: "INVALID_ROUTE_MODE",
        })
        return
      }

      const route = await this.routingService.calculateRoute(
        origin,
        destination,
        mode,
        accessibility
      )

      res.json({ route })

      logger.info("Route calculated successfully", {
        origin,
        destination,
        mode,
        accessibility,
        distance: route.distance,
        duration: route.duration,
      })
    } catch (error) {
      logger.error("Error calculating route", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to calculate route",
        error: "ROUTE_CALCULATION_ERROR",
      })
    }
  }

  /**
   * Optimize route for multiple waypoints
   */
  async optimizeRoute(req: Request, res: Response): Promise<void> {
    try {
      const { waypoints, mode = "walking" } = req.body

      // Validate waypoints
      if (
        !Array.isArray(waypoints) ||
        waypoints.length < 2 ||
        waypoints.length > 10
      ) {
        res.status(400).json({
          message: "Waypoints must be an array with 2-10 locations",
          error: "INVALID_WAYPOINTS",
        })
        return
      }

      // Validate each waypoint
      for (let i = 0; i < waypoints.length; i++) {
        const waypoint = waypoints[i]
        if (!ValidationUtils.isValidCoordinates(waypoint.lat, waypoint.lng)) {
          res.status(400).json({
            message: `Invalid coordinates for waypoint ${i}`,
            error: "INVALID_WAYPOINT_COORDINATES",
          })
          return
        }
      }

      // Validate mode
      if (!ValidationUtils.isValidRouteMode(mode)) {
        res.status(400).json({
          message: "Invalid route mode. Must be walking, driving, or cycling",
          error: "INVALID_ROUTE_MODE",
        })
        return
      }

      const optimizedRoute = await this.routingService.optimizeRoute(
        waypoints,
        mode
      )

      res.json({ route: optimizedRoute })

      logger.info("Route optimized successfully", {
        waypointCount: waypoints.length,
        mode,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
      })
    } catch (error) {
      logger.error("Error optimizing route", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to optimize route",
        error: "ROUTE_OPTIMIZATION_ERROR",
      })
    }
  }

  /**
   * Get accessibility-friendly route
   */
  async getAccessibilityRoute(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination } = req.query

      // Parse coordinates from query parameters
      const originCoords = {
        lat: parseFloat(
          (origin as any)?.lat || (req.query["origin.lat"] as string)
        ),
        lng: parseFloat(
          (origin as any)?.lng || (req.query["origin.lng"] as string)
        ),
      }

      const destCoords = {
        lat: parseFloat(
          (destination as any)?.lat || (req.query["destination.lat"] as string)
        ),
        lng: parseFloat(
          (destination as any)?.lng || (req.query["destination.lng"] as string)
        ),
      }

      // Validate origin coordinates
      if (
        !ValidationUtils.isValidCoordinates(originCoords.lat, originCoords.lng)
      ) {
        res.status(400).json({
          message: "Invalid origin coordinates",
          error: "INVALID_ORIGIN_COORDINATES",
        })
        return
      }

      // Validate destination coordinates
      if (!ValidationUtils.isValidCoordinates(destCoords.lat, destCoords.lng)) {
        res.status(400).json({
          message: "Invalid destination coordinates",
          error: "INVALID_DESTINATION_COORDINATES",
        })
        return
      }

      const route = await this.routingService.getAccessibilityRoute(
        originCoords,
        destCoords
      )

      res.json({ route })

      logger.info("Accessibility route calculated successfully", {
        origin: originCoords,
        destination: destCoords,
        distance: route.distance,
        duration: route.duration,
      })
    } catch (error) {
      logger.error("Error calculating accessibility route", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to calculate accessibility route",
        error: "ACCESSIBILITY_ROUTE_ERROR",
      })
    }
  }

  /**
   * Get emergency evacuation routes
   */
  async getEmergencyRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { location, type = "fire" } = req.query

      // Parse coordinates from query parameters
      const locationCoords = {
        lat: parseFloat(
          (location as any)?.lat || (req.query["location.lat"] as string)
        ),
        lng: parseFloat(
          (location as any)?.lng || (req.query["location.lng"] as string)
        ),
      }

      // Validate location coordinates
      if (
        !ValidationUtils.isValidCoordinates(
          locationCoords.lat,
          locationCoords.lng
        )
      ) {
        res.status(400).json({
          message: "Invalid location coordinates",
          error: "INVALID_LOCATION_COORDINATES",
        })
        return
      }

      // Validate emergency type
      const validTypes = ["fire", "medical", "security", "weather"]
      if (!validTypes.includes(type as string)) {
        res.status(400).json({
          message:
            "Invalid emergency type. Must be fire, medical, security, or weather",
          error: "INVALID_EMERGENCY_TYPE",
        })
        return
      }

      const routes = await this.routingService.getEmergencyRoutes(
        locationCoords,
        type as "fire" | "medical" | "security" | "weather"
      )

      res.json({ routes })

      logger.info("Emergency routes calculated successfully", {
        location: locationCoords,
        emergencyType: type,
      })
    } catch (error) {
      logger.error("Error calculating emergency routes", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to calculate emergency routes",
        error: "EMERGENCY_ROUTES_ERROR",
      })
    }
  }

  /**
   * Get campus tour routes
   */
  async getCampusTours(req: Request, res: Response): Promise<void> {
    try {
      const { duration, interests } = req.query

      let tourDuration: number | undefined
      let tourInterests: string[] | undefined

      // Validate duration if provided
      if (duration) {
        tourDuration = parseInt(duration as string)
        if (isNaN(tourDuration) || tourDuration < 30 || tourDuration > 180) {
          res.status(400).json({
            message: "Duration must be between 30 and 180 minutes",
            error: "INVALID_DURATION",
          })
          return
        }
      }

      // Validate interests if provided
      if (interests) {
        tourInterests = (interests as string).split(",").map((i) => i.trim())
        const validInterests = ["academic", "history", "recreation", "dining"]
        const invalidInterests = tourInterests.filter(
          (interest) => !validInterests.includes(interest)
        )

        if (invalidInterests.length > 0) {
          res.status(400).json({
            message: `Invalid interests: ${invalidInterests.join(", ")}`,
            error: "INVALID_INTERESTS",
            validInterests,
          })
          return
        }
      }

      const tours = await this.routingService.getCampusTours(
        tourDuration,
        tourInterests
      )

      res.json({ tours })

      logger.info("Campus tours retrieved successfully", {
        duration: tourDuration,
        interests: tourInterests,
        tourCount: tours.length,
      })
    } catch (error) {
      logger.error("Error retrieving campus tours", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to retrieve campus tours",
        error: "CAMPUS_TOURS_ERROR",
      })
    }
  }
}
