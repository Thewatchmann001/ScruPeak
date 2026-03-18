import axios, { AxiosInstance, AxiosError } from "axios";
import { ApiError } from "@/types";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "/api/v1",
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token from better-auth
    this.client.interceptors.request.use((config) => {
      // better-auth-session is usually stored as a cookie by the browser,
      // but if we need to pass a JWT, better-auth store is the source.
      // For ScruPeak backend compatibility, we check localStorage or cookies
      // where better-auth-session-token might be present.
      const token = localStorage.getItem("better-auth.session-token") || localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // In better-auth, session management is automated.
          // If we get a 401, we should redirect to login.
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data: any, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data: any, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  patch<T>(url: string, data: any, config = {}) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }
}

export const api = new ApiClient();
