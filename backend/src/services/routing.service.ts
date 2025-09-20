export interface Coordinates {
  lat: number
  lng: number
}

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
  mode: "walking" | "driving" | "cycling"
  accessibility: boolean
  distance: number // in meters
  duration: number // in seconds
  steps: RouteStep[]
  polyline: string // encoded polyline
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

export interface OptimizedRoute {
  waypoints: Coordinates[]
  optimizedOrder: number[]
  totalDistance: number
  totalDuration: number
  mode: "walking" | "driving" | "cycling"
  segments: {
    from: Coordinates
    to: Coordinates
    distance: number
    duration: number
  }[]
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
  emergencyContacts: {
    service: string
    phone: string
  }[]
}

export interface TourRoute {
  id: string
  name: string
  duration: number // in minutes
  distance: number // in kilometers
  description: string
  stops: {
    id: string
    name: string
    duration: number // time to spend at stop in minutes
    description: string
    coordinates?: Coordinates
  }[]
  polyline?: string
}

export class RoutingService {
  private mapboxApiKey?: string
  private googleMapsApiKey?: string

  constructor() {
    this.mapboxApiKey = process.env.MAPBOX_ACCESS_TOKEN
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
  }

  /**
   * Calculate route between two points
   */
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: "walking" | "driving" | "cycling" = "walking",
    accessibility: boolean = false
  ): Promise<Route> {
    try {
      // For now, return mock data
      // TODO: Integrate with actual routing service (Mapbox, Google Maps, etc.)

      const mockRoute: Route = {
        origin,
        destination,
        mode,
        accessibility,
        distance: this.calculateDistance(origin, destination) * 1000, // convert to meters
        duration: this.estimateDuration(origin, destination, mode),
        steps: this.generateMockSteps(origin, destination),
        polyline: this.encodePolyline([origin, destination]),
        bounds: this.calculateBounds([origin, destination]),
        warnings: accessibility
          ? ["Route optimized for accessibility"]
          : undefined,
      }

      return mockRoute
    } catch (error) {
      console.error("Error calculating route:", error)
      throw new Error("Failed to calculate route")
    }
  }

  /**
   * Optimize route for multiple waypoints
   */
  async optimizeRoute(
    waypoints: Coordinates[],
    mode: "walking" | "driving" | "cycling" = "walking"
  ): Promise<OptimizedRoute> {
    try {
      if (waypoints.length < 2) {
        throw new Error("At least 2 waypoints are required")
      }

      // Simple optimization: nearest neighbor algorithm
      // TODO: Implement more sophisticated optimization (TSP solver)
      const optimizedOrder = this.nearestNeighborOptimization(waypoints)

      const segments = []
      let totalDistance = 0
      let totalDuration = 0

      for (let i = 0; i < optimizedOrder.length - 1; i++) {
        const from = waypoints[optimizedOrder[i]]
        const to = waypoints[optimizedOrder[i + 1]]

        const distance = this.calculateDistance(from, to) * 1000 // convert to meters
        const duration = this.estimateDuration(from, to, mode)

        segments.push({ from, to, distance, duration })
        totalDistance += distance
        totalDuration += duration
      }

      return {
        waypoints,
        optimizedOrder,
        totalDistance,
        totalDuration,
        mode,
        segments,
      }
    } catch (error) {
      console.error("Error optimizing route:", error)
      throw new Error("Failed to optimize route")
    }
  }

  /**
   * Get accessibility-friendly route
   */
  async getAccessibilityRoute(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<Route> {
    try {
      const route = await this.calculateRoute(
        origin,
        destination,
        "walking",
        true
      )

      // Add accessibility-specific features
      route.warnings = [
        ...(route.warnings || []),
        "Route optimized for wheelchair accessibility",
        "Avoiding stairs and steep inclines",
      ]

      // Mock accessibility features
      route.alternativeEntrances = [
        {
          building: "Target Building",
          entrance: "South entrance with automatic doors and ramp access",
          coordinates: {
            lat: destination.lat - 0.0001,
            lng: destination.lng,
          },
        },
      ]

      return route
    } catch (error) {
      console.error("Error getting accessibility route:", error)
      throw new Error("Failed to get accessibility route")
    }
  }

  /**
   * Get emergency evacuation routes
   */
  async getEmergencyRoutes(
    location: Coordinates,
    emergencyType: "fire" | "medical" | "security" | "weather" = "fire"
  ): Promise<EmergencyRoute> {
    try {
      // Mock emergency assembly points
      const assemblyPoints = [
        {
          name: "Main Assembly Point",
          coordinates: { lat: 34.728, lng: -79.018 },
        },
        {
          name: "Secondary Assembly Point",
          coordinates: { lat: 34.7275, lng: -79.017 },
        },
      ]

      const primaryAssemblyPoint = assemblyPoints[0]
      const primaryDistance =
        this.calculateDistance(location, primaryAssemblyPoint.coordinates) *
        1000
      const primaryDuration = this.estimateDuration(
        location,
        primaryAssemblyPoint.coordinates,
        "walking"
      )

      const emergencyRoute: EmergencyRoute = {
        primaryRoute: {
          destination: primaryAssemblyPoint.name,
          coordinates: primaryAssemblyPoint.coordinates,
          distance: primaryDistance,
          duration: primaryDuration,
          instructions: this.generateEmergencyInstructions(emergencyType),
        },
        alternativeRoutes: assemblyPoints.slice(1).map((point) => ({
          destination: point.name,
          coordinates: point.coordinates,
          distance: this.calculateDistance(location, point.coordinates) * 1000,
          duration: this.estimateDuration(
            location,
            point.coordinates,
            "walking"
          ),
        })),
        emergencyContacts: [
          { service: "Campus Police", phone: "910-521-6235" },
          { service: "Emergency Services", phone: "911" },
          { service: "Campus Safety", phone: "910-521-6000" },
        ],
      }

      return emergencyRoute
    } catch (error) {
      console.error("Error getting emergency routes:", error)
      throw new Error("Failed to get emergency routes")
    }
  }

  /**
   * Get campus tour routes
   */
  async getCampusTours(
    duration?: number,
    interests?: string[]
  ): Promise<TourRoute[]> {
    try {
      // Mock tour data
      const tours: TourRoute[] = [
        {
          id: "highlights-tour",
          name: "Campus Highlights Tour",
          duration: 60,
          distance: 2.1,
          description: "Visit the most important landmarks on campus",
          stops: [
            {
              id: "1",
              name: "Chavis Student Center",
              duration: 10,
              description: "Heart of student life with dining and activities",
              coordinates: { lat: 34.727, lng: -79.0187 },
            },
            {
              id: "2",
              name: "Mary Livermore Library",
              duration: 15,
              description: "Main academic library with extensive resources",
              coordinates: { lat: 34.7265, lng: -79.0175 },
            },
            {
              id: "3",
              name: "The Quad",
              duration: 10,
              description: "Historic center of campus",
              coordinates: { lat: 34.7268, lng: -79.0182 },
            },
            {
              id: "4",
              name: "UNCP Performing Arts Center",
              duration: 15,
              description: "Cultural hub for performances and events",
              coordinates: { lat: 34.7262, lng: -79.0195 },
            },
          ],
        },
        {
          id: "academic-tour",
          name: "Academic Buildings Tour",
          duration: 90,
          distance: 3.2,
          description: "Explore the academic heart of UNCP",
          stops: [
            {
              id: "1",
              name: "Sampson Hall",
              duration: 20,
              description:
                "Main academic building housing multiple departments",
            },
            {
              id: "2",
              name: "Science Building",
              duration: 25,
              description:
                "State-of-the-art laboratories and research facilities",
            },
            {
              id: "3",
              name: "Business Administration Building",
              duration: 20,
              description: "Modern facilities for business education",
            },
          ],
        },
      ]

      // Filter tours based on duration and interests
      let filteredTours = tours

      if (duration) {
        filteredTours = filteredTours.filter(
          (tour) => tour.duration <= duration
        )
      }

      if (interests && interests.length > 0) {
        // Simple keyword matching in tour descriptions
        filteredTours = filteredTours.filter((tour) =>
          interests.some(
            (interest) =>
              tour.description.toLowerCase().includes(interest.toLowerCase()) ||
              tour.stops.some((stop) =>
                stop.description.toLowerCase().includes(interest.toLowerCase())
              )
          )
        )
      }

      return filteredTours
    } catch (error) {
      console.error("Error getting campus tours:", error)
      throw new Error("Failed to get campus tours")
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat)
    const dLng = this.toRadians(coord2.lng - coord1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Estimate duration based on distance and mode
   */
  private estimateDuration(
    origin: Coordinates,
    destination: Coordinates,
    mode: "walking" | "driving" | "cycling"
  ): number {
    const distance = this.calculateDistance(origin, destination)
    const speeds = {
      walking: 5, // km/h
      cycling: 15, // km/h
      driving: 30, // km/h (campus speed)
    }

    return Math.round((distance / speeds[mode]) * 3600) // convert to seconds
  }

  /**
   * Generate mock route steps
   */
  private generateMockSteps(
    origin: Coordinates,
    destination: Coordinates
  ): RouteStep[] {
    const totalDistance = this.calculateDistance(origin, destination) * 1000
    const midpoint = {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    }

    return [
      {
        instruction: "Head towards your destination",
        distance: totalDistance * 0.6,
        duration: Math.round((totalDistance * 0.6) / 1.4), // walking speed ~1.4 m/s
        coordinates: [origin, midpoint],
        maneuver: { type: "depart" },
      },
      {
        instruction: "Continue straight",
        distance: totalDistance * 0.3,
        duration: Math.round((totalDistance * 0.3) / 1.4),
        coordinates: [
          midpoint,
          { lat: midpoint.lat + 0.0001, lng: midpoint.lng + 0.0001 },
        ],
        maneuver: { type: "continue", modifier: "straight" },
      },
      {
        instruction: "Arrive at your destination",
        distance: totalDistance * 0.1,
        duration: Math.round((totalDistance * 0.1) / 1.4),
        coordinates: [
          { lat: destination.lat - 0.0001, lng: destination.lng - 0.0001 },
          destination,
        ],
        maneuver: { type: "arrive" },
      },
    ]
  }

  /**
   * Generate emergency instructions based on type
   */
  private generateEmergencyInstructions(type: string): string[] {
    const instructions = {
      fire: [
        "Exit building immediately via nearest safe exit",
        "Do not use elevators",
        "Stay low if smoke is present",
        "Proceed to designated assembly point",
        "Await further instructions from emergency personnel",
      ],
      medical: [
        "Call 911 if not already done",
        "Proceed to nearest emergency exit",
        "Meet emergency responders at main entrance",
        "Provide clear directions to emergency location",
      ],
      security: [
        "Move to secure location immediately",
        "Avoid affected area",
        "Follow campus police instructions",
        "Proceed to assembly point when safe",
      ],
      weather: [
        "Seek immediate shelter in sturdy building",
        "Stay away from windows",
        "Move to lowest floor if tornado warning",
        "Await all-clear signal",
      ],
    }

    return instructions[type as keyof typeof instructions] || instructions.fire
  }

  /**
   * Simple nearest neighbor optimization for waypoints
   */
  private nearestNeighborOptimization(waypoints: Coordinates[]): number[] {
    const unvisited = Array.from({ length: waypoints.length }, (_, i) => i)
    const route = [unvisited.shift()!]

    while (unvisited.length > 0) {
      const current = route[route.length - 1]
      let nearest = 0
      let nearestDistance = Infinity

      unvisited.forEach((waypointIndex, index) => {
        const distance = this.calculateDistance(
          waypoints[current],
          waypoints[waypointIndex]
        )
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = index
        }
      })

      route.push(unvisited.splice(nearest, 1)[0])
    }

    return route
  }

  /**
   * Calculate bounds for a set of coordinates
   */
  private calculateBounds(coordinates: Coordinates[]): {
    northeast: Coordinates
    southwest: Coordinates
  } {
    const lats = coordinates.map((c) => c.lat)
    const lngs = coordinates.map((c) => c.lng)

    return {
      northeast: {
        lat: Math.max(...lats),
        lng: Math.max(...lngs),
      },
      southwest: {
        lat: Math.min(...lats),
        lng: Math.min(...lngs),
      },
    }
  }

  /**
   * Simple polyline encoding (simplified version)
   */
  private encodePolyline(coordinates: Coordinates[]): string {
    // This is a simplified mock implementation
    // In production, use a proper polyline encoding algorithm
    return coordinates
      .map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`)
      .join(";")
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
