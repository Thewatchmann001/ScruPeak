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

    this.client.interceptors.request.use((config) => {
      if (!config.headers?.Authorization && config.url?.startsWith('/api/v1')) {
        console.warn(`[API] Sending authenticated request without Authorization header: ${config.url}`);
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
          // In Privy, session management is automated.
          // If we get a 401, we should potentially trigger a re-login or redirect.
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

  getErrorMessage(error: AxiosError<ApiError> | unknown) {
    if (!error || typeof error !== 'object') {
      return 'Unknown API error';
    }

    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError | undefined;
      return apiError?.message || error.message || 'Request failed';
    }

    return (error as Error).message || 'Unknown error occurred';
  }
}

export const api = new ApiClient();
export const setAuthToken = (token: string | null) => api.setAuthToken(token);
export const getApiErrorMessage = (error: AxiosError<ApiError> | unknown) => api.getErrorMessage(error);
