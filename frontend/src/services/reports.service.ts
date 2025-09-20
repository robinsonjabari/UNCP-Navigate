import { apiClient } from "./api"
import {
  Report,
  CreateReportRequest,
  ReportFilters,
  PaginatedResponse,
  PaginationParams,
} from "@/types"

/**
 * Reports Service
 * Handles all campus reporting API calls
 * These methods correspond exactly to your backend reports routes
 */
export class ReportsService {
  /**
   * Create new report - POST /api/reports
   */
  static async createReport(reportData: CreateReportRequest): Promise<{
    message: string
    report: Report
  }> {
    return apiClient.post<{ message: string; report: Report }>(
      "/reports",
      reportData
    )
  }

  /**
   * Get all reports with filtering - GET /api/reports
   */
  static async getReports(
    filters?: ReportFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Report>> {
    const params = { ...filters, ...pagination }
    return apiClient.get<PaginatedResponse<Report>>("/reports", params)
  }

  /**
   * Get report by ID - GET /api/reports/:id
   */
  static async getReportById(id: string): Promise<{ report: Report }> {
    return apiClient.get<{ report: Report }>(`/reports/${id}`)
  }

  /**
   * Update report status - PUT /api/reports/:id/status (Admin/Staff only)
   */
  static async updateReportStatus(
    id: string,
    statusData: {
      status: "open" | "in_progress" | "resolved" | "closed"
      notes?: string
    }
  ): Promise<{ message: string; report: Report }> {
    return apiClient.put<{ message: string; report: Report }>(
      `/reports/${id}/status`,
      statusData
    )
  }

  /**
   * Delete report - DELETE /api/reports/:id
   */
  static async deleteReport(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/reports/${id}`)
  }

  /**
   * Get report statistics - GET /api/reports/stats
   */
  static async getReportStats(
    timeRange?: "7d" | "30d" | "90d" | "1y"
  ): Promise<{
    stats: {
      total: number
      byStatus: Record<string, number>
      byType: Record<string, number>
      bySeverity: Record<string, number>
      timeRange: string
    }
  }> {
    return apiClient.get<{
      stats: {
        total: number
        byStatus: Record<string, number>
        byType: Record<string, number>
        bySeverity: Record<string, number>
        timeRange: string
      }
    }>("/reports/stats", { timeRange })
  }

  /**
   * Get user's reports - GET /api/reports/my-reports
   */
  static async getMyReports(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Report>> {
    return apiClient.get<PaginatedResponse<Report>>(
      "/reports/my-reports",
      pagination
    )
  }

  /**
   * Get reports by location - GET /api/reports/location
   */
  static async getReportsByLocation(params: {
    lat: number
    lng: number
    radius?: number
  }): Promise<{ reports: Report[] }> {
    return apiClient.get<{ reports: Report[] }>("/reports/location", params)
  }

  /**
   * Get recent reports - GET /api/reports/recent
   */
  static async getRecentReports(
    limit?: number
  ): Promise<{ reports: Report[] }> {
    return apiClient.get<{ reports: Report[] }>("/reports/recent", { limit })
  }

  /**
   * Get high priority reports - GET /api/reports/priority
   */
  static async getHighPriorityReports(): Promise<{ reports: Report[] }> {
    return apiClient.get<{ reports: Report[] }>("/reports/priority")
  }

  /**
   * Add comment to report - POST /api/reports/:id/comments
   */
  static async addComment(
    id: string,
    commentData: { comment: string }
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `/reports/${id}/comments`,
      commentData
    )
  }

  /**
   * Get report comments - GET /api/reports/:id/comments
   */
  static async getReportComments(id: string): Promise<{
    comments: Array<{
      id: string
      comment: string
      author: string
      createdAt: Date
    }>
  }> {
    return apiClient.get<{
      comments: Array<{
        id: string
        comment: string
        author: string
        createdAt: Date
      }>
    }>(`/reports/${id}/comments`)
  }

  /**
   * Upload report attachment - POST /api/reports/:id/attachments
   */
  static async uploadAttachment(
    id: string,
    file: File,
    description?: string
  ): Promise<{ message: string; attachmentId: string }> {
    const formData = new FormData()
    formData.append("file", file)
    if (description) {
      formData.append("description", description)
    }

    return apiClient.post<{ message: string; attachmentId: string }>(
      `/reports/${id}/attachments`,
      formData
    )
  }

  /**
   * Get report attachments - GET /api/reports/:id/attachments
   */
  static async getReportAttachments(id: string): Promise<{
    attachments: Array<{
      id: string
      filename: string
      description?: string
      url: string
      uploadedAt: Date
    }>
  }> {
    return apiClient.get<{
      attachments: Array<{
        id: string
        filename: string
        description?: string
        url: string
        uploadedAt: Date
      }>
    }>(`/reports/${id}/attachments`)
  }

  /**
   * Subscribe to report updates - POST /api/reports/:id/subscribe
   */
  static async subscribeToReport(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/reports/${id}/subscribe`)
  }

  /**
   * Unsubscribe from report updates - DELETE /api/reports/:id/subscribe
   */
  static async unsubscribeFromReport(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/reports/${id}/subscribe`)
  }
}

export default ReportsService
