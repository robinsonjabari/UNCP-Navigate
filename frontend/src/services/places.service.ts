import { apiClient } from "./api"
import {
  Place,
  PlaceSearchRequest,
  PaginatedResponse,
  PlaceType,
  MapBounds,
} from "@/types"

/**
 * Places Service
 * Handles all campus places/locations API calls
 * These methods correspond exactly to your backend places routes
 */
export class PlacesService {
  /**
   * Search places - GET /api/places/search
   */
  static async searchPlaces(
    searchParams: PlaceSearchRequest
  ): Promise<PaginatedResponse<Place>> {
    return apiClient.get<PaginatedResponse<Place>>(
      "/places/search",
      searchParams
    )
  }

  /**
   * Get all places - GET /api/places
   */
  static async getAllPlaces(params?: {
    type?: PlaceType
    accessibility?: boolean
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Place>> {
    return apiClient.get<PaginatedResponse<Place>>("/places", params)
  }

  /**
   * Get place by ID - GET /api/places/:id
   */
  static async getPlaceById(id: string): Promise<{ place: Place }> {
    return apiClient.get<{ place: Place }>(`/places/${id}`)
  }

  /**
   * Get places by type - GET /api/places/type/:type
   */
  static async getPlacesByType(type: PlaceType): Promise<{ places: Place[] }> {
    return apiClient.get<{ places: Place[] }>(`/places/type/${type}`)
  }

  /**
   * Get nearby places - GET /api/places/nearby
   */
  static async getNearbyPlaces(params: {
    lat: number
    lng: number
    radius?: number
    type?: PlaceType
    limit?: number
  }): Promise<{ places: Place[] }> {
    return apiClient.get<{ places: Place[] }>("/places/nearby", params)
  }

  /**
   * Get places within bounds - GET /api/places/bounds
   */
  static async getPlacesInBounds(
    bounds: MapBounds
  ): Promise<{ places: Place[] }> {
    return apiClient.get<{ places: Place[] }>("/places/bounds", bounds)
  }

  /**
   * Get accessibility-friendly places - GET /api/places/accessibility
   */
  static async getAccessibilityPlaces(): Promise<{ places: Place[] }> {
    return apiClient.get<{ places: Place[] }>("/places/accessibility")
  }

  /**
   * Get place categories/types - GET /api/places/categories
   */
  static async getPlaceCategories(): Promise<{ categories: PlaceType[] }> {
    return apiClient.get<{ categories: PlaceType[] }>("/places/categories")
  }

  /**
   * Get popular places - GET /api/places/popular
   */
  static async getPopularPlaces(limit?: number): Promise<{ places: Place[] }> {
    return apiClient.get<{ places: Place[] }>("/places/popular", { limit })
  }

  /**
   * Get featured places - GET /api/places/featured
   */
  static async getFeaturedPlaces(): Promise<{ places: Place[] }> {
    return apiClient.get<{ places: Place[] }>("/places/featured")
  }

  /**
   * Create new place - POST /api/places (Admin only)
   */
  static async createPlace(
    placeData: Omit<Place, "id" | "createdAt" | "updatedAt">
  ): Promise<{
    place: Place
    message: string
  }> {
    return apiClient.post<{ place: Place; message: string }>(
      "/places",
      placeData
    )
  }

  /**
   * Update place - PUT /api/places/:id (Admin only)
   */
  static async updatePlace(
    id: string,
    updateData: Partial<Place>
  ): Promise<{ place: Place; message: string }> {
    return apiClient.put<{ place: Place; message: string }>(
      `/places/${id}`,
      updateData
    )
  }

  /**
   * Delete place - DELETE /api/places/:id (Admin only)
   */
  static async deletePlace(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/places/${id}`)
  }

  /**
   * Report place issue - POST /api/places/:id/report
   */
  static async reportPlaceIssue(
    id: string,
    reportData: {
      issue: string
      description: string
      severity: "low" | "medium" | "high"
    }
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/places/${id}/report`,
      reportData
    )
  }

  /**
   * Add place to favorites - POST /api/places/:id/favorite
   */
  static async addToFavorites(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/places/${id}/favorite`)
  }

  /**
   * Remove place from favorites - DELETE /api/places/:id/favorite
   */
  static async removeFromFavorites(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/places/${id}/favorite`)
  }

  /**
   * Get user's favorite places - GET /api/places/favorites
   */
  static async getFavorites(): Promise<{ places: Place[] }> {
    return apiClient.get<{ places: Place[] }>("/places/favorites")
  }
}

export default PlacesService
