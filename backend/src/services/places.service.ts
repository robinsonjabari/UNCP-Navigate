import { Pool } from "pg"

export interface Place {
  id: string
  name: string
  description: string
  category:
    | "academic"
    | "administrative"
    | "dining"
    | "recreation"
    | "residence"
    | "parking"
    | "other"
  coordinates: {
    lat: number
    lng: number
  }
  address: string
  hours?: {
    open: string
    close: string
  }
  amenities?: string[]
  accessibility: boolean
  images?: string[]
  floor_plans?: string[]
  reviews?: {
    average: number
    count: number
  }
  created_at?: Date
  updated_at?: Date
}

export interface PlaceSearchParams {
  category?: string
  search?: string
  limit?: number
  offset?: number
  accessibility?: boolean
}

export interface NearbySearchParams {
  lat: number
  lng: number
  radius?: number // in kilometers
  category?: string
}

export class PlacesService {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Get all places with optional filtering
   */
  async getAllPlaces(
    params: PlaceSearchParams
  ): Promise<{ places: Place[]; total: number }> {
    try {
      let query = `
        SELECT * FROM places 
        WHERE 1=1
      `
      const values: any[] = []
      let paramCount = 0

      // Add filtering conditions
      if (params.category) {
        paramCount++
        query += ` AND category = $${paramCount}`
        values.push(params.category)
      }

      if (params.search) {
        paramCount++
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`
        values.push(`%${params.search}%`)
      }

      if (params.accessibility !== undefined) {
        paramCount++
        query += ` AND accessibility = $${paramCount}`
        values.push(params.accessibility)
      }

      // Count total results
      const countQuery = query.replace("SELECT *", "SELECT COUNT(*)")
      const countResult = await this.pool.query(countQuery, values)
      const total = parseInt(countResult.rows[0].count)

      // Add pagination
      query += ` ORDER BY name`

      if (params.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        values.push(params.limit)
      }

      if (params.offset) {
        paramCount++
        query += ` OFFSET $${paramCount}`
        values.push(params.offset)
      }

      const result = await this.pool.query(query, values)
      const places = result.rows.map(this.mapRowToPlace)

      return { places, total }
    } catch (error) {
      console.error("Error fetching places:", error)
      throw new Error("Failed to fetch places")
    }
  }

  /**
   * Get a single place by ID
   */
  async getPlaceById(id: string): Promise<Place | null> {
    try {
      const query = "SELECT * FROM places WHERE id = $1"
      const result = await this.pool.query(query, [id])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToPlace(result.rows[0])
    } catch (error) {
      console.error("Error fetching place by ID:", error)
      throw new Error("Failed to fetch place")
    }
  }

  /**
   * Create a new place
   */
  async createPlace(
    place: Omit<Place, "id" | "created_at" | "updated_at">
  ): Promise<Place> {
    try {
      const query = `
        INSERT INTO places (name, description, category, coordinates, address, hours, amenities, accessibility, images, floor_plans)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `

      const values = [
        place.name,
        place.description,
        place.category,
        JSON.stringify(place.coordinates),
        place.address,
        place.hours ? JSON.stringify(place.hours) : null,
        place.amenities ? JSON.stringify(place.amenities) : null,
        place.accessibility,
        place.images ? JSON.stringify(place.images) : null,
        place.floor_plans ? JSON.stringify(place.floor_plans) : null,
      ]

      const result = await this.pool.query(query, values)
      return this.mapRowToPlace(result.rows[0])
    } catch (error) {
      console.error("Error creating place:", error)
      throw new Error("Failed to create place")
    }
  }

  /**
   * Update an existing place
   */
  async updatePlace(
    id: string,
    updates: Partial<Place>
  ): Promise<Place | null> {
    try {
      const setClause: string[] = []
      const values: any[] = []
      let paramCount = 0

      // Build dynamic SET clause
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== "id" && value !== undefined) {
          paramCount++
          if (typeof value === "object" && value !== null) {
            setClause.push(`${key} = $${paramCount}`)
            values.push(JSON.stringify(value))
          } else {
            setClause.push(`${key} = $${paramCount}`)
            values.push(value)
          }
        }
      })

      if (setClause.length === 0) {
        return this.getPlaceById(id)
      }

      // Add updated_at timestamp
      paramCount++
      setClause.push(`updated_at = $${paramCount}`)
      values.push(new Date())

      // Add ID parameter
      paramCount++
      values.push(id)

      const query = `
        UPDATE places 
        SET ${setClause.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `

      const result = await this.pool.query(query, values)

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToPlace(result.rows[0])
    } catch (error) {
      console.error("Error updating place:", error)
      throw new Error("Failed to update place")
    }
  }

  /**
   * Delete a place
   */
  async deletePlace(id: string): Promise<boolean> {
    try {
      const query = "DELETE FROM places WHERE id = $1"
      const result = await this.pool.query(query, [id])
      return (result.rowCount ?? 0) > 0
    } catch (error) {
      console.error("Error deleting place:", error)
      throw new Error("Failed to delete place")
    }
  }

  /**
   * Find places near a coordinate
   */
  async findNearbyPlaces(params: NearbySearchParams): Promise<Place[]> {
    try {
      let query = `
        SELECT *, 
        (6371 * acos(cos(radians($1)) * cos(radians((coordinates->>'lat')::float)) * 
        cos(radians((coordinates->>'lng')::float) - radians($2)) + 
        sin(radians($1)) * sin(radians((coordinates->>'lat')::float)))) AS distance
        FROM places
        WHERE (6371 * acos(cos(radians($1)) * cos(radians((coordinates->>'lat')::float)) * 
        cos(radians((coordinates->>'lng')::float) - radians($2)) + 
        sin(radians($1)) * sin(radians((coordinates->>'lat')::float)))) <= $3
      `

      const values: (string | number)[] = [
        params.lat,
        params.lng,
        params.radius || 1.0,
      ]
      let paramCount = 3

      if (params.category) {
        paramCount++
        query += ` AND category = $${paramCount}`
        values.push(params.category)
      }

      query += ` ORDER BY distance LIMIT 20`

      const result = await this.pool.query(query, values)
      return result.rows.map((row) => {
        const place = this.mapRowToPlace(row)
        // Add distance to the place object
        ;(place as any).distance = parseFloat(row.distance)
        return place
      })
    } catch (error) {
      console.error("Error finding nearby places:", error)
      throw new Error("Failed to find nearby places")
    }
  }

  /**
   * Search places by text
   */
  async searchPlaces(searchTerm: string, limit: number = 10): Promise<Place[]> {
    try {
      const query = `
        SELECT *, 
        ts_rank(to_tsvector('english', name || ' ' || description), plainto_tsquery('english', $1)) as rank
        FROM places
        WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', $1)
        OR name ILIKE $2 
        OR description ILIKE $2
        ORDER BY rank DESC, name
        LIMIT $3
      `

      const values = [searchTerm, `%${searchTerm}%`, limit]
      const result = await this.pool.query(query, values)
      return result.rows.map(this.mapRowToPlace)
    } catch (error) {
      console.error("Error searching places:", error)
      throw new Error("Failed to search places")
    }
  }

  /**
   * Get places by category
   */
  async getPlacesByCategory(category: string): Promise<Place[]> {
    try {
      const query = "SELECT * FROM places WHERE category = $1 ORDER BY name"
      const result = await this.pool.query(query, [category])
      return result.rows.map(this.mapRowToPlace)
    } catch (error) {
      console.error("Error fetching places by category:", error)
      throw new Error("Failed to fetch places by category")
    }
  }

  /**
   * Get popular places based on usage statistics
   */
  async getPopularPlaces(limit: number = 10): Promise<Place[]> {
    try {
      // This would typically join with a usage tracking table
      const query = `
        SELECT p.*, COALESCE(s.visit_count, 0) as visit_count
        FROM places p
        LEFT JOIN (
          SELECT place_id, COUNT(*) as visit_count
          FROM place_visits
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY place_id
        ) s ON p.id = s.place_id
        ORDER BY visit_count DESC, name
        LIMIT $1
      `

      const result = await this.pool.query(query, [limit])
      return result.rows.map(this.mapRowToPlace)
    } catch (error) {
      console.error("Error fetching popular places:", error)
      // Fallback to random selection if stats table doesn't exist
      return this.getAllPlaces({ limit }).then((result) => result.places)
    }
  }

  /**
   * Map database row to Place object
   */
  private mapRowToPlace(row: any): Place {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      coordinates:
        typeof row.coordinates === "string"
          ? JSON.parse(row.coordinates)
          : row.coordinates,
      address: row.address,
      hours: row.hours
        ? typeof row.hours === "string"
          ? JSON.parse(row.hours)
          : row.hours
        : undefined,
      amenities: row.amenities
        ? typeof row.amenities === "string"
          ? JSON.parse(row.amenities)
          : row.amenities
        : undefined,
      accessibility: row.accessibility,
      images: row.images
        ? typeof row.images === "string"
          ? JSON.parse(row.images)
          : row.images
        : undefined,
      floor_plans: row.floor_plans
        ? typeof row.floor_plans === "string"
          ? JSON.parse(row.floor_plans)
          : row.floor_plans
        : undefined,
      reviews: row.reviews
        ? typeof row.reviews === "string"
          ? JSON.parse(row.reviews)
          : row.reviews
        : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }
}
