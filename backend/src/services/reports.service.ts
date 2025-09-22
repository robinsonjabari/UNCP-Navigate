import pool from "../db/pool"
import { logger } from "../utils/logger"
import {
  Report,
  CreateReportData,
  ReportFilters,
  PaginationOptions,
} from "../types"

export class ReportsService {
  /**
   * Create a new report
   */
  async createReport(reportData: CreateReportData): Promise<Report> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO reports (
          type, title, description, location, severity, 
          submitted_by, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'open', NOW(), NOW())
        RETURNING id, type, title, description, location, severity, 
                  submitted_by, status, created_at, updated_at
      `

      const values = [
        reportData.type,
        reportData.title,
        reportData.description,
        JSON.stringify(reportData.location),
        reportData.severity,
        reportData.submittedBy,
      ]

      const result = await client.query(query, values)

      logger.info("Report created in database", {
        reportId: result.rows[0].id,
        type: reportData.type,
      })

      return this.mapDbReportToReport(result.rows[0])
    } catch (error) {
      logger.error("Error creating report in database", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get reports with filtering and pagination
   */
  async getReports(
    filters: ReportFilters,
    pagination: PaginationOptions
  ): Promise<{
    reports: Report[]
    total: number
    page: number
    totalPages: number
  }> {
    const client = await pool.connect()
    try {
      const conditions = ["deleted_at IS NULL"]
      const values = []
      let paramIndex = 1

      // Build WHERE clause based on filters
      if (filters.status) {
        conditions.push(`status = $${paramIndex}`)
        values.push(filters.status)
        paramIndex++
      }

      if (filters.type) {
        conditions.push(`type = $${paramIndex}`)
        values.push(filters.type)
        paramIndex++
      }

      if (filters.severity) {
        conditions.push(`severity = $${paramIndex}`)
        values.push(filters.severity)
        paramIndex++
      }

      const whereClause = conditions.join(" AND ")

      // Count total records
      const countQuery = `SELECT COUNT(*) FROM reports WHERE ${whereClause}`
      const countResult = await client.query(countQuery, values)
      const total = parseInt(countResult.rows[0].count)

      // Calculate pagination
      const offset = (pagination.page - 1) * pagination.limit
      const totalPages = Math.ceil(total / pagination.limit)

      // Build ORDER BY clause
      const orderBy = `ORDER BY ${pagination.sortBy} ${pagination.sortOrder}`

      // Get paginated results
      const dataQuery = `
        SELECT id, type, title, description, location, severity, 
               submitted_by, status, notes, created_at, updated_at
        FROM reports 
        WHERE ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      values.push(pagination.limit, offset)
      const dataResult = await client.query(dataQuery, values)

      const reports = dataResult.rows.map((row) =>
        this.mapDbReportToReport(row)
      )

      logger.info("Reports retrieved from database", {
        total,
        page: pagination.page,
        filters,
      })

      return {
        reports,
        total,
        page: pagination.page,
        totalPages,
      }
    } catch (error) {
      logger.error("Error retrieving reports from database", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(id: string): Promise<Report | null> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT id, type, title, description, location, severity, 
               submitted_by, status, notes, created_at, updated_at
        FROM reports 
        WHERE id = $1 AND deleted_at IS NULL
      `

      const result = await client.query(query, [id])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapDbReportToReport(result.rows[0])
    } catch (error) {
      logger.error("Error retrieving report by ID", {
        error: error instanceof Error ? error.message : "Unknown error",
        reportId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update report status
   */
  async updateReportStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<Report | null> {
    const client = await pool.connect()
    try {
      const query = `
        UPDATE reports 
        SET status = $1, notes = $2, updated_at = NOW()
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING id, type, title, description, location, severity, 
                  submitted_by, status, notes, created_at, updated_at
      `

      const result = await client.query(query, [status, notes, id])

      if (result.rows.length === 0) {
        return null
      }

      logger.info("Report status updated in database", {
        reportId: id,
        newStatus: status,
      })

      return this.mapDbReportToReport(result.rows[0])
    } catch (error) {
      logger.error("Error updating report status in database", {
        error: error instanceof Error ? error.message : "Unknown error",
        reportId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Delete report (soft delete)
   */
  async deleteReport(id: string, userId?: string): Promise<boolean> {
    const client = await pool.connect()
    try {
      // Check if user has permission to delete (only the submitter or admin)
      let query = `
        UPDATE reports 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
      `

      const values = [id]

      if (userId) {
        query += ` AND submitted_by = $2`
        values.push(userId)
      }

      const result = await client.query(query, values)

      const deleted = (result.rowCount ?? 0) > 0

      if (deleted) {
        logger.info("Report soft deleted from database", {
          reportId: id,
          deletedBy: userId,
        })
      }

      return deleted
    } catch (error) {
      logger.error("Error deleting report from database", {
        error: error instanceof Error ? error.message : "Unknown error",
        reportId: id,
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(timeRange: string): Promise<any> {
    const client = await pool.connect()
    try {
      let dateCondition = ""

      switch (timeRange) {
        case "7d":
          dateCondition = "AND created_at >= NOW() - INTERVAL '7 days'"
          break
        case "30d":
          dateCondition = "AND created_at >= NOW() - INTERVAL '30 days'"
          break
        case "90d":
          dateCondition = "AND created_at >= NOW() - INTERVAL '90 days'"
          break
        case "1y":
          dateCondition = "AND created_at >= NOW() - INTERVAL '1 year'"
          break
        default:
          dateCondition = "AND created_at >= NOW() - INTERVAL '30 days'"
      }

      // Get total counts by status
      const statusQuery = `
        SELECT status, COUNT(*) as count
        FROM reports 
        WHERE deleted_at IS NULL ${dateCondition}
        GROUP BY status
      `

      const statusResult = await client.query(statusQuery)

      // Get total counts by type
      const typeQuery = `
        SELECT type, COUNT(*) as count
        FROM reports 
        WHERE deleted_at IS NULL ${dateCondition}
        GROUP BY type
      `

      const typeResult = await client.query(typeQuery)

      // Get total counts by severity
      const severityQuery = `
        SELECT severity, COUNT(*) as count
        FROM reports 
        WHERE deleted_at IS NULL ${dateCondition}
        GROUP BY severity
      `

      const severityResult = await client.query(severityQuery)

      // Get total count
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM reports 
        WHERE deleted_at IS NULL ${dateCondition}
      `

      const totalResult = await client.query(totalQuery)

      const stats = {
        total: parseInt(totalResult.rows[0].total),
        byStatus: statusResult.rows.reduce((acc: any, row: any) => {
          acc[row.status] = parseInt(row.count)
          return acc
        }, {}),
        byType: typeResult.rows.reduce((acc: any, row: any) => {
          acc[row.type] = parseInt(row.count)
          return acc
        }, {}),
        bySeverity: severityResult.rows.reduce((acc: any, row: any) => {
          acc[row.severity] = parseInt(row.count)
          return acc
        }, {}),
        timeRange,
      }

      logger.info("Report statistics retrieved from database", {
        timeRange,
        total: stats.total,
      })

      return stats
    } catch (error) {
      logger.error("Error retrieving report statistics from database", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Map database report row to Report interface
   */
  private mapDbReportToReport(dbReport: any): Report {
    return {
      id: dbReport.id,
      type: dbReport.type,
      title: dbReport.title,
      description: dbReport.description,
      location: JSON.parse(dbReport.location),
      severity: dbReport.severity,
      submittedBy: dbReport.submitted_by,
      status: dbReport.status,
      notes: dbReport.notes,
      createdAt: dbReport.created_at,
      updatedAt: dbReport.updated_at,
    }
  }
}
