import axios from 'axios';
import { API_URL } from '../config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly TOKEN_EXPIRY_KEY = 'auth_expiry';

  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, credentials);
      const { token, expiresIn } = response.data;
      
      // Store token in an HTTP-only cookie (handled by backend)
      // We only store the expiry time in localStorage for UI purposes
      localStorage.setItem(AuthService.TOKEN_EXPIRY_KEY, 
        (Date.now() + expiresIn * 1000).toString()
      );
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  logout(): void {
    // Clear local storage
    localStorage.removeItem(AuthService.TOKEN_EXPIRY_KEY);
    
    // Call backend to clear HTTP-only cookie
    axios.post(`${API_URL}/auth/logout`)
      .catch(error => console.error('Logout error:', error));
  }

  isAuthenticated(): boolean {
    const expiryTime = localStorage.getItem(AuthService.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return false;
    
    return Date.now() < parseInt(expiryTime);
  }

  async refreshToken(): Promise<void> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`);
      const { expiresIn } = response.data;
      
      localStorage.setItem(AuthService.TOKEN_EXPIRY_KEY, 
        (Date.now() + expiresIn * 1000).toString()
      );
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Setup axios interceptor for automatic token refresh
  setupAxiosInterceptors(): void {
    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}

export const authService = new AuthService();
export default authService;
