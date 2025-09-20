import { pool } from "../db/pool"
import { logger } from "../utils/logger"
import { User, CreateUserData, UpdateUserData } from "../types"

export class AuthService {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<User> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO users (email, password, first_name, last_name, student_id, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, first_name, last_name, student_id, role, created_at, updated_at
      `

      const values = [
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.studentId,
        userData.role || "student",
      ]

      const result = await client.query(query, values)

      logger.info("User created in database", {
        userId: result.rows[0].id,
        email: userData.email,
      })

      return this.mapDbUserToUser(result.rows[0])
    } catch (error) {
      logger.error("Error creating user in database", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: userData.email,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT id, email, password, first_name, last_name, student_id, role, 
               preferences, last_login, created_at, updated_at
        FROM users 
        WHERE email = $1 AND deleted_at IS NULL
      `

      const result = await client.query(query, [email])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapDbUserToUser(result.rows[0])
    } catch (error) {
      logger.error("Error retrieving user by email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT id, email, password, first_name, last_name, student_id, role, 
               preferences, last_login, created_at, updated_at
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `

      const result = await client.query(query, [id])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapDbUserToUser(result.rows[0])
    } catch (error) {
      logger.error("Error retrieving user by ID", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update user data
   */
  async updateUser(
    id: string,
    updateData: UpdateUserData
  ): Promise<User | null> {
    const client = await pool.connect()
    try {
      const setClause = []
      const values = []
      let paramIndex = 1

      if (updateData.firstName) {
        setClause.push(`first_name = $${paramIndex}`)
        values.push(updateData.firstName)
        paramIndex++
      }

      if (updateData.lastName) {
        setClause.push(`last_name = $${paramIndex}`)
        values.push(updateData.lastName)
        paramIndex++
      }

      if (updateData.studentId !== undefined) {
        setClause.push(`student_id = $${paramIndex}`)
        values.push(updateData.studentId)
        paramIndex++
      }

      if (updateData.preferences) {
        setClause.push(`preferences = $${paramIndex}`)
        values.push(JSON.stringify(updateData.preferences))
        paramIndex++
      }

      if (setClause.length === 0) {
        throw new Error("No fields to update")
      }

      setClause.push(`updated_at = NOW()`)
      values.push(id)

      const query = `
        UPDATE users 
        SET ${setClause.join(", ")}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING id, email, first_name, last_name, student_id, role, 
                  preferences, last_login, created_at, updated_at
      `

      const result = await client.query(query, values)

      if (result.rows.length === 0) {
        return null
      }

      logger.info("User updated in database", {
        userId: id,
        updatedFields: Object.keys(updateData),
      })

      return this.mapDbUserToUser(result.rows[0])
    } catch (error) {
      logger.error("Error updating user in database", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE users 
        SET password = $1, updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
      `

      const result = await client.query(query, [hashedPassword, id])

      if (result.rowCount === 0) {
        throw new Error("User not found")
      }

      logger.info("User password updated in database", { userId: id })
    } catch (error) {
      logger.error("Error updating user password in database", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE users 
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
      `

      await client.query(query, [id])

      logger.info("User last login updated", { userId: id })
    } catch (error) {
      logger.error("Error updating user last login", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Soft delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE users 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
      `

      const result = await client.query(query, [id])

      const deleted = result.rowCount > 0

      if (deleted) {
        logger.info("User soft deleted from database", { userId: id })
      }

      return deleted
    } catch (error) {
      logger.error("Error deleting user from database", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Map database user row to User interface
   */
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      password: dbUser.password,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      studentId: dbUser.student_id,
      role: dbUser.role,
      preferences: dbUser.preferences ? JSON.parse(dbUser.preferences) : {},
      lastLogin: dbUser.last_login,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    }
  }
}
