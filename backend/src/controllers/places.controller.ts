import { Request, Response } from "express"
import { PlacesService } from "../services/places.service"
import { ValidationUtils } from "../utils/validation"
import { logger } from "../utils/logger"
import pool from "../db/pool"

// Helper function for error handling
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unknown error"
}

export class PlacesController {
  private placesService: PlacesService

  constructor() {
    this.placesService = new PlacesService(pool)
  }

  /**
   * Get all places with optional filtering
   */
  async getAllPlaces(req: Request, res: Response): Promise<void> {
    try {
      const { category, search, limit, offset, accessibility } = req.query

      const params = {
        category: category as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        accessibility: accessibility === "true",
      }

      const result = await this.placesService.getAllPlaces(params)

      res.json({
        places: result.places,
        pagination: {
          total: result.total,
          limit: params.limit || 50,
          offset: params.offset || 0,
          hasMore: (params.offset || 0) + (params.limit || 50) < result.total,
        },
      })

      logger.info("Places retrieved successfully", {
        total: result.total,
        filters: params,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      logger.error("Error retrieving places", { error: errorMessage })
      res.status(500).json({
        message: "Failed to retrieve places",
        error: "PLACES_RETRIEVAL_ERROR",
      })
    }
  }

  /**
   * Get a single place by ID
   */
  async getPlaceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json({
          message: "Invalid place ID format",
          error: "INVALID_PLACE_ID",
        })
        return
      }

      const place = await this.placesService.getPlaceById(id)

      if (!place) {
        res.status(404).json({
          message: "Place not found",
          error: "PLACE_NOT_FOUND",
        })
        return
      }

      res.json({ place })

      logger.info("Place retrieved successfully", { placeId: id })
    } catch (error) {
      logger.error("Error retrieving place by ID", {
        placeId: req.params.id,
        error: getErrorMessage(error),
      })
      res.status(500).json({
        message: "Failed to retrieve place",
        error: "PLACE_RETRIEVAL_ERROR",
      })
    }
  }

  /**
   * Create a new place (Admin only)
   */
  async createPlace(req: Request, res: Response): Promise<void> {
    try {
      const placeData = req.body

      // Validate required fields
      if (
        !placeData.name ||
        !placeData.description ||
        !placeData.category ||
        !placeData.coordinates ||
        !placeData.address
      ) {
        res.status(400).json({
          message: "Missing required fields",
          error: "MISSING_REQUIRED_FIELDS",
          required: [
            "name",
            "description",
            "category",
            "coordinates",
            "address",
          ],
        })
        return
      }

      // Validate coordinates
      if (
        !ValidationUtils.isValidCoordinates(
          placeData.coordinates.lat,
          placeData.coordinates.lng
        )
      ) {
        res.status(400).json({
          message: "Invalid coordinates",
          error: "INVALID_COORDINATES",
        })
        return
      }

      // Validate category
      if (!ValidationUtils.isValidPlaceCategory(placeData.category)) {
        res.status(400).json({
          message: "Invalid place category",
          error: "INVALID_CATEGORY",
        })
        return
      }

      const newPlace = await this.placesService.createPlace(placeData)

      res.status(201).json({
        message: "Place created successfully",
        place: newPlace,
      })

      logger.info("Place created successfully", {
        placeId: newPlace.id,
        name: newPlace.name,
        createdBy: req.user?.id,
      })
    } catch (error) {
      logger.error("Error creating place", {
        error: getErrorMessage(error),
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Failed to create place",
        error: "PLACE_CREATION_ERROR",
      })
    }
  }

  /**
   * Update an existing place (Admin only)
   */
  async updatePlace(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updates = req.body

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json({
          message: "Invalid place ID format",
          error: "INVALID_PLACE_ID",
        })
        return
      }

      // Validate coordinates if provided
      if (
        updates.coordinates &&
        !ValidationUtils.isValidCoordinates(
          updates.coordinates.lat,
          updates.coordinates.lng
        )
      ) {
        res.status(400).json({
          message: "Invalid coordinates",
          error: "INVALID_COORDINATES",
        })
        return
      }

      // Validate category if provided
      if (
        updates.category &&
        !ValidationUtils.isValidPlaceCategory(updates.category)
      ) {
        res.status(400).json({
          message: "Invalid place category",
          error: "INVALID_CATEGORY",
        })
        return
      }

      const updatedPlace = await this.placesService.updatePlace(id, updates)

      if (!updatedPlace) {
        res.status(404).json({
          message: "Place not found",
          error: "PLACE_NOT_FOUND",
        })
        return
      }

      res.json({
        message: "Place updated successfully",
        place: updatedPlace,
      })

      logger.info("Place updated successfully", {
        placeId: id,
        updatedBy: req.user?.id,
      })
    } catch (error) {
      logger.error("Error updating place", {
        placeId: req.params.id,
        error: getErrorMessage(error),
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Failed to update place",
        error: "PLACE_UPDATE_ERROR",
      })
    }
  }

  /**
   * Delete a place (Admin only)
   */
  async deletePlace(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json({
          message: "Invalid place ID format",
          error: "INVALID_PLACE_ID",
        })
        return
      }

      const deleted = await this.placesService.deletePlace(id)

      if (!deleted) {
        res.status(404).json({
          message: "Place not found",
          error: "PLACE_NOT_FOUND",
        })
        return
      }

      res.json({
        message: "Place deleted successfully",
      })

      logger.info("Place deleted successfully", {
        placeId: id,
        deletedBy: req.user?.id,
      })
    } catch (error) {
      logger.error("Error deleting place", {
        placeId: req.params.id,
        error: getErrorMessage(error),
        userId: req.user?.id,
      })
      res.status(500).json({
        message: "Failed to delete place",
        error: "PLACE_DELETION_ERROR",
      })
    }
  }

  /**
   * Get places near a coordinate
   */
  async getNearbyPlaces(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng } = req.params
      const { radius, category } = req.query

      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)

      if (!ValidationUtils.isValidCoordinates(latitude, longitude)) {
        res.status(400).json({
          message: "Invalid coordinates",
          error: "INVALID_COORDINATES",
        })
        return
      }

      const params = {
        lat: latitude,
        lng: longitude,
        radius: radius ? parseFloat(radius as string) : 1.0,
        category: category as string,
      }

      const places = await this.placesService.findNearbyPlaces(params)

      res.json({ places })

      logger.info("Nearby places retrieved successfully", {
        coordinates: { lat: latitude, lng: longitude },
        radius: params.radius,
        count: places.length,
      })
    } catch (error) {
      logger.error("Error retrieving nearby places", {
        coordinates: { lat: req.params.lat, lng: req.params.lng },
        error: getErrorMessage(error),
      })
      res.status(500).json({
        message: "Failed to retrieve nearby places",
        error: "NEARBY_PLACES_ERROR",
      })
    }
  }

  /**
   * Search places by text
   */
  async searchPlaces(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit } = req.query

      if (!q || typeof q !== "string") {
        res.status(400).json({
          message: "Search query is required",
          error: "MISSING_SEARCH_QUERY",
        })
        return
      }

      const searchTerm = ValidationUtils.sanitizeSearchQuery(q)
      const searchLimit = limit ? parseInt(limit as string) : 10

      const places = await this.placesService.searchPlaces(
        searchTerm,
        searchLimit
      )

      res.json({
        places,
        query: searchTerm,
        total: places.length,
      })

      logger.info("Places search completed", {
        query: searchTerm,
        results: places.length,
      })
    } catch (error) {
      logger.error("Error searching places", {
        query: req.query.q,
        error: getErrorMessage(error),
      })
      res.status(500).json({
        message: "Failed to search places",
        error: "PLACES_SEARCH_ERROR",
      })
    }
  }

  /**
   * Get popular places
   */
  async getPopularPlaces(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query
      const popularLimit = limit ? parseInt(limit as string) : 10

      const places = await this.placesService.getPopularPlaces(popularLimit)

      res.json({ places })

      logger.info("Popular places retrieved successfully", {
        count: places.length,
      })
    } catch (error) {
      logger.error("Error retrieving popular places", {
        error: getErrorMessage(error),
      })
      res.status(500).json({
        message: "Failed to retrieve popular places",
        error: "POPULAR_PLACES_ERROR",
      })
    }
  }
}
