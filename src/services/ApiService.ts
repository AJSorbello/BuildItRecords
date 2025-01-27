import { AxiosRequestConfig } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import axios from 'axios';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ApiService {
  private static instance: ApiService;
  private baseURL: string;

  private constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private handleError(error: unknown, method: string): never {
    logger.error(`ApiService.${method} error:`, error);
    throw error;
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.get<ApiResponse<T>>(`${this.baseURL}${endpoint}`, {
        ...config,
        headers: {
          ...this.getHeaders(),
          ...(config?.headers || {}),
        },
      });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'get');
    }
  }

  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.post<ApiResponse<T>>(`${this.baseURL}${endpoint}`, data, {
        ...config,
        headers: {
          ...this.getHeaders(),
          ...(config?.headers || {}),
        },
      });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'post');
    }
  }

  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.put<ApiResponse<T>>(`${this.baseURL}${endpoint}`, data, {
        ...config,
        headers: {
          ...this.getHeaders(),
          ...(config?.headers || {}),
        },
      });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'put');
    }
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.delete<ApiResponse<T>>(`${this.baseURL}${endpoint}`, {
        ...config,
        headers: {
          ...this.getHeaders(),
          ...(config?.headers || {}),
        },
      });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

export const apiService = ApiService.getInstance();
