import { Router, Request, Response } from "express"
import { query, param, body } from "express-validator"
import { validateRequest } from "../middleware/validate"
import { authenticate, authorize } from "../middleware/auth"
import pool from "../db/pool"
import { PlacesService } from "../services/places.service"

const router = Router()

/**
 * @route   GET /api/places
 * @desc    Get all campus places with optional filtering
 * @access  Public
 */
router.get(
  "/",
  [
    // Accept either TitleCase or lowercase categories
    query("category").optional().isString().withMessage("Invalid category"),
    query("search")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Search term must be between 1 and 100 characters"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Offset must be a non-negative integer"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const service = new PlacesService(pool as any)

      const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 100)
      const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10), 0)
      const categoryRaw =
        (req.query.category as string | undefined) ?? undefined
      // Normalize category to lowercase to match DB
      const category = categoryRaw ? categoryRaw.toLowerCase() : undefined
      const search = (req.query.search as string | undefined) ?? undefined

      const searchParams: any = { limit, offset }
      if (category) searchParams.category = category
      if (search) searchParams.search = search

      const { places, total } = await service.getAllPlaces(searchParams)

      res.json({
        places,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + places.length < total,
        },
      })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   GET /api/places/:id
 * @desc    Get a specific place by ID
 * @access  Public
 */
router.get(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid place ID format"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const service = new PlacesService(pool as any)
      const place = await service.getPlaceById(req.params.id)
      if (!place) {
        res.status(404).json({ message: "Place not found" })
        return
      }
      res.json({ place })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   POST /api/places
 * @desc    Create a new place (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/",
  [
    authenticate,
    authorize(["admin"]),
    body("name")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("description")
      .isLength({ min: 10, max: 500 })
      .withMessage("Description must be between 10 and 500 characters"),
    body("category")
      .isIn([
        "Academic",
        "Administrative",
        "Dining",
        "Recreation",
        "Residence",
        "Parking",
        "Other",
      ])
      .withMessage("Invalid category"),
    body("coordinates.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid latitude"),
    body("coordinates.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid longitude"),
    body("address")
      .isLength({ min: 10, max: 200 })
      .withMessage("Address must be between 10 and 200 characters"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const service = new PlacesService(pool as any)
      // Normalize category to lowercase for DB
      const payload = {
        ...req.body,
        category: (req.body.category as string).toLowerCase(),
      }
      const created = await service.createPlace(payload)
      res
        .status(201)
        .json({ message: "Place created successfully", place: created })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   PUT /api/places/:id
 * @desc    Update a place (Admin only)
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  [
    authenticate,
    authorize(["admin"]),
    param("id").isUUID().withMessage("Invalid place ID format"),
    body("name")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage("Description must be between 10 and 500 characters"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const service = new PlacesService(pool as any)
      const updates = { ...req.body }
      if (updates.category)
        updates.category = String(updates.category).toLowerCase()
      const updated = await service.updatePlace(req.params.id, updates)
      if (!updated) {
        res.status(404).json({ message: "Place not found" })
        return
      }
      res.json({ message: "Place updated successfully", place: updated })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   DELETE /api/places/:id
 * @desc    Delete a place (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  [
    authenticate,
    authorize(["admin"]),
    param("id").isUUID().withMessage("Invalid place ID format"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const service = new PlacesService(pool as any)
      const ok = await service.deletePlace(req.params.id)
      if (!ok) {
        res.status(404).json({ message: "Place not found" })
        return
      }
      res.json({ message: "Place deleted successfully" })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

/**
 * @route   GET /api/places/nearby
 * @desc    Get places near a coordinate
 * @access  Public
 */
router.get(
  "/nearby/:lat/:lng",
  [
    param("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
    param("lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid longitude"),
    query("radius")
      .optional()
      .isFloat({ min: 0.1, max: 10 })
      .withMessage("Radius must be between 0.1 and 10 km"),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const service = new PlacesService(pool as any)
      const lat = Number(req.params.lat)
      const lng = Number(req.params.lng)
      const radius = req.query.radius ? Number(req.query.radius) : 1
      const category = (req.query.category as string | undefined)?.toLowerCase()

      const nearParams: any = { lat, lng, radius }
      if (category) nearParams.category = category

      const places = await service.findNearbyPlaces(nearParams)
      res.json({ places })
    } catch (error) {
      res.status(500).json({ message: "Internal server error" })
    }
  }
)

export default router
