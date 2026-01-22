// src/renderer/services/api/api.service.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { storageService } from '../stores/electron-store.service';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.BACKEND_URL || 'http://localhost:3000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add session user to headers
    this.client.interceptors.request.use(
      async (config: any) => {
        // Get current session
        const session = await storageService.getSession();
        
        if (session?.user) {
          // Add user info to header for backend authentication
          config.headers['x-user'] = JSON.stringify({
            id: session.user.id,
            username: session.user.username,
            role: session.user.role,
            isActive: session.user.isActive,
          });
        }
        
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const message = (error.response.data as any)?.message || 'An error occurred';
          
          // Handle unauthorized - clear session
          if (status === 401 || status === 403) {
            await storageService.clearSession();
            window.dispatchEvent(new CustomEvent('session-expired'));
            return Promise.reject(new Error('Session expired. Please login again.'));
          }
          
          return Promise.reject(new Error(message));
        } else if (error.request) {
          // Request made but no response
          return Promise.reject(new Error('Server is not responding. Check if backend is running.'));
        } else {
          // Something else happened
          return Promise.reject(error);
        }
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  setBaseURL(url: string) {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

export const apiService = new ApiService();