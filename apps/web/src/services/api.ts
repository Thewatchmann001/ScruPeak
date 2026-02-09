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

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
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

        // Handle 401 Unauthorized - Try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem("refresh_token");

          if (refreshToken) {
            try {
              // Call refresh endpoint directly using axios to avoid interceptor loop
              const response = await axios.post(
                `${this.client.defaults.baseURL}/auth/refresh`,
                { refresh_token: refreshToken }
              );

              const { access_token, refresh_token: new_refresh_token } = response.data;

              localStorage.setItem("access_token", access_token);
              if (new_refresh_token) {
                localStorage.setItem("refresh_token", new_refresh_token);
              }

              // Update header and retry original request
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed - logout
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              window.location.href = "/auth/login";
            }
          } else {
            // No refresh token - logout
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/auth/login";
          }
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
