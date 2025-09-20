import axios, { AxiosInstance, AxiosResponse } from "axios"
import Cookies from "js-cookie"

// API Configuration - Update these URLs to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
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
      secure: true,
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
