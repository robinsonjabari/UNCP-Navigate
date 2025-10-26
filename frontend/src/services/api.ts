import axios, { AxiosInstance, AxiosResponse } from "axios"
import Cookies from "js-cookie"

// API base URL
// In dev, prefer a relative base "/api" so Vite's proxy forwards to the backend.
// In prod, set VITE_API_URL to your API origin (e.g., https://api.example.com/api).
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"
const TOKEN_COOKIE_NAME = "uncp_nav_token"

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken()
          // Redirect to login if needed
          window.location.href = "/login"
        }
        return Promise.reject(error)
      }
    )
  }

  // Token management
  setToken(token: string): void {
    Cookies.set(TOKEN_COOKIE_NAME, token, {
      expires: 7,
      // Only mark secure over HTTPS so cookies work on http://localhost in dev
      secure: window.location.protocol === "https:",
      sameSite: "strict",
    })
  }

  getToken(): string | undefined {
    return Cookies.get(TOKEN_COOKIE_NAME)
  }

  clearToken(): void {
    Cookies.remove(TOKEN_COOKIE_NAME)
  }

  // Generic HTTP methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data)
    return response.data
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url)
    return response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
