import { apiClient } from "./api"
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
} from "@/types"

/**
 * Authentication Service
 * Handles all authentication-related API calls
 * These methods correspond exactly to your backend auth routes
 */
export class AuthService {
  /**
   * User login - POST /api/auth/login
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials
    )

    // Store token after successful login
    if (response.token) {
      apiClient.setToken(response.token)
    }

    return response
  }

  /**
   * User registration - POST /api/auth/register
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      userData
    )

    // Store token after successful registration
    if (response.token) {
      apiClient.setToken(response.token)
    }

    return response
  }

  /**
   * Get current user profile - GET /api/auth/profile
   */
  static async getProfile(): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>("/auth/profile")
  }

  /**
   * Update user profile - PUT /api/auth/profile
   */
  static async updateProfile(
    updateData: Partial<User>
  ): Promise<{ user: User; message: string }> {
    return apiClient.put<{ user: User; message: string }>(
      "/auth/profile",
      updateData
    )
  }

  /**
   * Change password - PUT /api/auth/change-password
   */
  static async changePassword(passwordData: {
    currentPassword: string
    newPassword: string
  }): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(
      "/auth/change-password",
      passwordData
    )
  }

  /**
   * Refresh JWT token - POST /api/auth/refresh
   */
  static async refreshToken(): Promise<{ token: string; message: string }> {
    const response = await apiClient.post<{ token: string; message: string }>(
      "/auth/refresh"
    )

    // Update stored token
    if (response.token) {
      apiClient.setToken(response.token)
    }

    return response
  }

  /**
   * User logout - POST /api/auth/logout
   */
  static async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>("/auth/logout")

    // Clear stored token
    apiClient.clearToken()

    return response
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!apiClient.getToken()
  }

  /**
   * Get stored token
   */
  static getToken(): string | undefined {
    return apiClient.getToken()
  }

  /**
   * Clear authentication data
   */
  static clearAuth(): void {
    apiClient.clearToken()
  }
}

export default AuthService
