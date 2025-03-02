import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_URL = getApiBaseUrl().replace(/\/api$/, '');

class AdminService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/admin`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to add token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
}

export default new AdminService();
