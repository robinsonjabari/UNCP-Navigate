import { Request, Response } from "express"
import { ReportsService } from "../services/reports.service"
import { ValidationUtils } from "../utils/validation"
import { logger } from "../utils/logger"
import { ReportStatus, ReportType, ReportPriority } from "../types"

export class ReportsController {
  private reportsService: ReportsService

  constructor() {
    this.reportsService = new ReportsService()
  }

  /**
   * Submit a new report
   */
  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        type,
        title,
        description,
        location,
        severity = "medium",
      } = req.body
      const userId = req.user?.id

      // Validate required fields
      if (!type || !title || !description || !location) {
        res.status(400).json({
          message:
            "Missing required fields: type, title, description, location",
          error: "MISSING_REQUIRED_FIELDS",
        })
        return
      }

      // Validate report type
      const validTypes = ["maintenance", "safety", "accessibility", "other"]
      if (!validTypes.includes(type)) {
        res.status(400).json({
          message:
            "Invalid report type. Must be maintenance, safety, accessibility, or other",
          error: "INVALID_REPORT_TYPE",
          validTypes,
        })
        return
      }

      // Validate severity
      const validSeverities = ["low", "medium", "high", "critical"]
      if (!validSeverities.includes(severity)) {
        res.status(400).json({
          message: "Invalid severity. Must be low, medium, high, or critical",
          error: "INVALID_SEVERITY",
          validSeverities,
        })
        return
      }

      // Validate location coordinates if provided
      if (
        location.coordinates &&
        !ValidationUtils.isValidCoordinates(
          location.coordinates.lat,
          location.coordinates.lng
        )
      ) {
        res.status(400).json({
          message: "Invalid location coordinates",
          error: "INVALID_COORDINATES",
        })
        return
      }

      const reportData = {
        type,
        title,
        description,
        location,
        priority: severity, // Map severity to priority
        userId, // Map submittedBy to userId
      }

      const report = await this.reportsService.createReport(reportData)
      res.status(201).json({
        message: "Report submitted successfully",
        report,
      })

      logger.info("Report created successfully", {
        reportId: report.id,
        type,
        severity,
        userId,
      })
    } catch (error) {
      logger.error("Error creating report", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to create report",
        error: "REPORT_CREATION_ERROR",
      })
    }
  }

  /**
   * Get all reports with filtering
   */
  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        type,
        severity,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query

      // Validate pagination parameters
      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          message: "Page must be a positive integer",
          error: "INVALID_PAGE",
        })
        return
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          message: "Limit must be between 1 and 100",
          error: "INVALID_LIMIT",
        })
        return
      }

      // Validate filters
      if (
        status &&
        !["open", "in_progress", "resolved", "closed"].includes(
          status as string
        )
      ) {
        res.status(400).json({
          message: "Invalid status filter",
          error: "INVALID_STATUS_FILTER",
        })
        return
      }

      if (
        type &&
        !["maintenance", "safety", "accessibility", "other"].includes(
          type as string
        )
      ) {
        res.status(400).json({
          message: "Invalid type filter",
          error: "INVALID_TYPE_FILTER",
        })
        return
      }

      if (
        severity &&
        !["low", "medium", "high", "critical"].includes(severity as string)
      ) {
        res.status(400).json({
          message: "Invalid severity filter",
          error: "INVALID_SEVERITY_FILTER",
        })
        return
      }

      // Validate sort parameters
      const validSortFields = ["createdAt", "updatedAt", "severity", "status"]
      if (!validSortFields.includes(sortBy as string)) {
        res.status(400).json({
          message: "Invalid sort field",
          error: "INVALID_SORT_FIELD",
          validFields: validSortFields,
        })
        return
      }

      if (!["asc", "desc"].includes(sortOrder as string)) {
        res.status(400).json({
          message: "Sort order must be asc or desc",
          error: "INVALID_SORT_ORDER",
        })
        return
      }

      const filters = {
        status: status as ReportStatus,
        type: type as ReportType,
        priority: severity as ReportPriority,
      }

      const pagination = {
        page: pageNum,
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "ASC" | "DESC",
      }

      const result = await this.reportsService.getReports(filters, pagination)

      res.json(result)

      logger.info("Reports retrieved successfully", {
        filters,
        pagination,
        totalReports: result.total,
      })
    } catch (error) {
      logger.error("Error retrieving reports", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to retrieve reports",
        error: "REPORTS_RETRIEVAL_ERROR",
      })
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json({
          message: "Invalid report ID format",
          error: "INVALID_REPORT_ID",
        })
        return
      }

      const report = await this.reportsService.getReportById(id)

      if (!report) {
        res.status(404).json({
          message: "Report not found",
          error: "REPORT_NOT_FOUND",
        })
        return
      }

      res.json({ report })

      logger.info("Report retrieved successfully", {
        reportId: id,
      })
    } catch (error) {
      logger.error("Error retrieving report", {
        error: error instanceof Error ? error.message : "Unknown error",
        reportId: req.params.id,
      })
      res.status(500).json({
        message: "Failed to retrieve report",
        error: "REPORT_RETRIEVAL_ERROR",
      })
    }
  }

  /**
   * Update report status
   */
  async updateReportStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status, notes } = req.body

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json({
          message: "Invalid report ID format",
          error: "INVALID_REPORT_ID",
        })
        return
      }

      // Validate status
      const validStatuses = ["open", "in_progress", "resolved", "closed"]
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          message:
            "Invalid status. Must be open, in_progress, resolved, or closed",
          error: "INVALID_STATUS",
          validStatuses,
        })
        return
      }

      const updatedReport = await this.reportsService.updateReportStatus(
        id,
        status,
        notes
      )

      if (!updatedReport) {
        res.status(404).json({
          message: "Report not found",
          error: "REPORT_NOT_FOUND",
        })
        return
      }

      res.json({
        message: "Report status updated successfully",
        report: updatedReport,
      })

      logger.info("Report status updated successfully", {
        reportId: id,
        newStatus: status,
        notes: notes ? "Notes provided" : "No notes",
      })
    } catch (error) {
      logger.error("Error updating report status", {
        error: error instanceof Error ? error.message : "Unknown error",
        reportId: req.params.id,
      })
      res.status(500).json({
        message: "Failed to update report status",
        error: "REPORT_UPDATE_ERROR",
      })
    }
  }

  /**
   * Delete report
   */
  async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!ValidationUtils.isValidUUID(id)) {
        res.status(400).json({
          message: "Invalid report ID format",
          error: "INVALID_REPORT_ID",
        })
        return
      }

      const deleted = await this.reportsService.deleteReport(id, userId)

      if (!deleted) {
        res.status(404).json({
          message: "Report not found or unauthorized to delete",
          error: "REPORT_NOT_FOUND_OR_UNAUTHORIZED",
        })
        return
      }

      res.json({
        message: "Report deleted successfully",
      })

      logger.info("Report deleted successfully", {
        reportId: id,
        deletedBy: userId,
      })
    } catch (error) {
      logger.error("Error deleting report", {
        error: error instanceof Error ? error.message : "Unknown error",
        reportId: req.params.id,
      })
      res.status(500).json({
        message: "Failed to delete report",
        error: "REPORT_DELETION_ERROR",
      })
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(req: Request, res: Response): Promise<void> {
    try {
      const { timeRange = "30d" } = req.query

      // Validate time range
      const validRanges = ["7d", "30d", "90d", "1y"]
      if (!validRanges.includes(timeRange as string)) {
        res.status(400).json({
          message: "Invalid time range. Must be 7d, 30d, 90d, or 1y",
          error: "INVALID_TIME_RANGE",
          validRanges,
        })
        return
      }

      const stats = await this.reportsService.getReportStats(
        timeRange as string
      )

      res.json({ stats })

      logger.info("Report statistics retrieved successfully", {
        timeRange,
      })
    } catch (error) {
      logger.error("Error retrieving report statistics", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      res.status(500).json({
        message: "Failed to retrieve report statistics",
        error: "REPORT_STATS_ERROR",
      })
    }
  }
}
