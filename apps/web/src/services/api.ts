import axios, { AxiosInstance, AxiosError } from "axios";
import { ApiError } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || 'https://api-gateway-prod-kqr3pbuu3a-uc.a.run.app';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // In Privy, session management is automated.
          // If we get a 401, we should potentially trigger a re-login or redirect.
          // For now, we'll just redirect to login if we can't refresh.
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Call this after Privy is ready to inject token
  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
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
export const setAuthToken = (token: string | null) => api.setAuthToken(token);
// Sat Apr 18 03:31:40 PM UTC 2026
