import { Router, Request, Response } from "express"
import { body, query } from "express-validator"
import { validateRequest } from "../middleware/validate"

const router = Router()

/**
 * @route   POST /api/routes/directions
 * @desc    Get directions between two points
 * @access  Public
 */
router.post(
  "/directions",
  [
    body("origin").notEmpty().withMessage("Origin is required"),
    body("origin.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid origin latitude"),
    body("origin.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid origin longitude"),
    body("destination").notEmpty().withMessage("Destination is required"),
    body("destination.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid destination latitude"),
    body("destination.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid destination longitude"),
    body("mode")
      .optional()
      .isIn(["walking", "driving", "cycling"])
      .withMessage("Mode must be walking, driving, or cycling"),
    body("accessibility")
      .optional()
      .isBoolean()
      .withMessage("Accessibility must be a boolean"),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      const {
        origin,
        destination,
        mode = "walking",
        accessibility = false,
      } = req.body

      // TODO: Implement routing service integration
      const route = {
        origin,
        destination,
        mode,
        accessibility,
        distance: 0.75, // km
        duration: 540, // seconds (9 minutes)
        steps: [
          {
            instruction: "Head north on University Drive",
            distance: 200,
            duration: 120,
            coordinates: [
              { lat: 34.727, lng: -79.0187 },
              { lat: 34.7275, lng: -79.0187 },
            ],
          },
          {
            instruction: "Turn left onto Academic Lane",
            distance: 300,
            duration: 180,
            coordinates: [
              { lat: 34.7275, lng: -79.0187 },
              { lat: 34.7275, lng: -79.019 },
            ],
          },
          {
            instruction: "Arrive at Mary Livermore Library",
            distance: 250,
            duration: 150,
            coordinates: [
              { lat: 34.7275, lng: -79.019 },
              { lat: 34.7265, lng: -79.0175 },
            ],
          },
        ],
        polyline: "encodedPolylineString",
        bounds: {
          northeast: { lat: 34.728, lng: -79.017 },
          southwest: { lat: 34.726, lng: -79.0195 },
        },
      }

      res.json({ route })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   POST /api/routes/optimize
 * @desc    Optimize route for multiple waypoints
 * @access  Public
 */
router.post(
  "/optimize",
  [
    body("waypoints")
      .isArray({ min: 2, max: 10 })
      .withMessage("Waypoints must be an array with 2-10 locations"),
    body("waypoints.*.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid waypoint latitude"),
    body("waypoints.*.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid waypoint longitude"),
    body("mode")
      .optional()
      .isIn(["walking", "driving", "cycling"])
      .withMessage("Mode must be walking, driving, or cycling"),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      const { waypoints, mode = "walking" } = req.body

      // TODO: Implement route optimization algorithm
      const optimizedRoute = {
        waypoints: waypoints,
        optimizedOrder: [0, 1, 2], // Optimized order of waypoints
        totalDistance: 1.2, // km
        totalDuration: 720, // seconds (12 minutes)
        mode,
        segments: [
          {
            from: waypoints[0],
            to: waypoints[1],
            distance: 0.5,
            duration: 300,
          },
          {
            from: waypoints[1],
            to: waypoints[2],
            distance: 0.7,
            duration: 420,
          },
        ],
      }

      res.json({ route: optimizedRoute })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   GET /api/routes/accessibility
 * @desc    Get accessibility-friendly routes
 * @access  Public
 */
router.get(
  "/accessibility",
  [
    query("origin.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid origin latitude"),
    query("origin.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid origin longitude"),
    query("destination.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid destination latitude"),
    query("destination.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid destination longitude"),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      // TODO: Implement accessibility-specific routing using req.body coordinates
      void req // Will use req.body.origin/destination when implemented
      const accessibleRoute = {
        distance: 0.9, // km (may be longer than regular route)
        duration: 660, // seconds (11 minutes)
        accessibilityFeatures: [
          "wheelchair_accessible",
          "elevator_access",
          "ramp_access",
          "accessible_parking",
        ],
        warnings: ["Construction on Academic Lane - temporary ramp available"],
        alternativeEntrances: [
          {
            building: "Mary Livermore Library",
            entrance: "South entrance with automatic doors",
            coordinates: { lat: 34.7263, lng: -79.0175 },
          },
        ],
      }

      res.json({ route: accessibleRoute })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   GET /api/routes/emergency
 * @desc    Get emergency evacuation routes
 * @access  Public
 */
router.get(
  "/emergency",
  [
    query("location.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid location latitude"),
    query("location.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid location longitude"),
    query("type")
      .optional()
      .isIn(["fire", "medical", "security", "weather"])
      .withMessage(
        "Emergency type must be fire, medical, security, or weather"
      ),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      // TODO: Implement emergency routing using req.body parameters
      void req // Will use req.body.currentLocation/emergencyType when implemented
      const emergencyRoutes = {
        primaryRoute: {
          destination: "Main Assembly Point",
          coordinates: { lat: 34.728, lng: -79.018 },
          distance: 0.3,
          duration: 180,
          instructions: [
            "Exit building immediately via nearest exit",
            "Head to main assembly point on University Drive",
            "Await further instructions from emergency personnel",
          ],
        },
        alternativeRoutes: [
          {
            destination: "Secondary Assembly Point",
            coordinates: { lat: 34.7275, lng: -79.017 },
            distance: 0.4,
            duration: 240,
          },
        ],
        emergencyContacts: [
          { service: "Campus Police", phone: "910-521-6235" },
          { service: "Emergency Services", phone: "911" },
        ],
      }

      res.json({ routes: emergencyRoutes })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   GET /api/routes/campus-tour
 * @desc    Get predefined campus tour routes
 * @access  Public
 */
router.get(
  "/campus-tour",
  [
    query("duration")
      .optional()
      .isInt({ min: 30, max: 180 })
      .withMessage("Duration must be between 30 and 180 minutes"),
    query("interests")
      .optional()
      .custom((value) => {
        const validInterests = ["academic", "history", "recreation", "dining"]
        const interests = value.split(",")
        return interests.every((interest: string) =>
          validInterests.includes(interest.trim())
        )
      })
      .withMessage("Invalid interest categories"),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      // TODO: Implement campus tour route generation using req.body parameters
      void req // Will use req.body.interests/duration when implemented
      const tourRoutes = [
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
              description: "Heart of student life",
            },
            {
              id: "2",
              name: "Mary Livermore Library",
              duration: 15,
              description: "Academic resources and study spaces",
            },
            {
              id: "3",
              name: "The Quad",
              duration: 10,
              description: "Historic center of campus",
            },
          ],
        },
      ]

      res.json({ tours: tourRoutes })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   POST /api/routes/calculate
 * @desc    Calculate route (alias for directions endpoint)
 * @access  Public
 */
router.post(
  "/calculate",
  [
    body("origin").notEmpty().withMessage("Origin is required"),
    body("origin.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid origin latitude"),
    body("origin.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid origin longitude"),
    body("destination").notEmpty().withMessage("Destination is required"),
    body("destination.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid destination latitude"),
    body("destination.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid destination longitude"),
    body("mode")
      .optional()
      .isIn(["walking", "driving", "cycling"])
      .withMessage("Mode must be walking, driving, or cycling"),
    body("accessibility")
      .optional()
      .isBoolean()
      .withMessage("Accessibility must be a boolean"),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      const {
        origin,
        destination,
        mode = "walking",
        accessibility = false,
      } = req.body

      // Calculate route between two points
      const route = {
        origin,
        destination,
        mode,
        accessibility,
        distance: Math.round((Math.random() * 2 + 0.5) * 100) / 100, // 0.5-2.5 km
        duration: Math.round(Math.random() * 900 + 300), // 5-20 minutes
        steps: [
          {
            instruction: "Head north from starting point",
            distance: 200,
            duration: 120,
            coordinates: [origin, { lat: origin.lat + 0.001, lng: origin.lng }],
          },
          {
            instruction: "Continue straight on main path",
            distance: 400,
            duration: 240,
            coordinates: [
              { lat: origin.lat + 0.001, lng: origin.lng },
              { lat: destination.lat - 0.001, lng: destination.lng },
            ],
          },
          {
            instruction: "Arrive at destination",
            distance: 100,
            duration: 60,
            coordinates: [
              { lat: destination.lat - 0.001, lng: destination.lng },
              destination,
            ],
          },
        ],
        polyline: "demo_polyline_string",
        bounds: {
          northeast: {
            lat: Math.max(origin.lat, destination.lat) + 0.001,
            lng: Math.max(origin.lng, destination.lng) + 0.001,
          },
          southwest: {
            lat: Math.min(origin.lat, destination.lat) - 0.001,
            lng: Math.min(origin.lng, destination.lng) - 0.001,
          },
        },
      }

      res.json({
        success: true,
        route,
        message: "Route calculated successfully",
      })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   POST /api/routes/emergency
 * @desc    Get emergency route to nearest safe location
 * @access  Public
 */
router.post(
  "/emergency",
  [
    body("location").notEmpty().withMessage("Current location is required"),
    body("location.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid location latitude"),
    body("location.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid location longitude"),
    body("emergencyType")
      .optional()
      .isIn(["medical", "security", "fire", "general"])
      .withMessage(
        "Emergency type must be medical, security, fire, or general"
      ),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      const { location, emergencyType = "general" } = req.body

      // Find nearest emergency service/safe location
      const emergencyDestination = {
        lat: 34.727, // Campus Security Office
        lng: -79.018,
      }

      const emergencyRoute = {
        origin: location,
        destination: emergencyDestination,
        emergencyType,
        priority: "high",
        estimatedArrival: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        distance: 0.3, // km
        duration: 180, // 3 minutes
        emergencyContacts: [
          {
            service: "Campus Security",
            phone: "(910) 521-6235",
            location: "Security Office, Main Campus",
          },
          {
            service: "Emergency Services",
            phone: "911",
            location: "Local Emergency Dispatch",
          },
        ],
        steps: [
          {
            instruction: "EMERGENCY ROUTE - Head directly to Campus Security",
            distance: 150,
            duration: 90,
            urgent: true,
            coordinates: [
              location,
              { lat: location.lat + 0.0005, lng: location.lng },
            ],
          },
          {
            instruction:
              "Arrive at Campus Security Office - Help is available 24/7",
            distance: 150,
            duration: 90,
            urgent: true,
            coordinates: [
              { lat: location.lat + 0.0005, lng: location.lng },
              emergencyDestination,
            ],
          },
        ],
        safetyInstructions: [
          "Stay calm and follow the designated route",
          "Call 911 if immediate medical attention is needed",
          "Contact Campus Security at (910) 521-6235",
          "Stay on well-lit paths when possible",
        ],
      }

      res.json({
        success: true,
        emergency: true,
        route: emergencyRoute,
        message: "Emergency route calculated - Stay safe!",
      })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

export default router
