import type { User } from '../hooks/useAuth';
import { getApiBaseUrl } from '../utils/apiConfig';

type AuthChangeCallback = (user: User | null) => void;

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private currentToken: string | null = null;
  private subscribers: Set<AuthChangeCallback> = new Set();
  private baseUrl: string;

  private constructor() {
    this.baseUrl = getApiBaseUrl();
    // Try to restore session from localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.currentToken = savedToken;
        this.notifySubscribers();
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.currentUser));
  }

  public async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { user, token } = await response.json();
      this.currentUser = user;
      this.currentToken = token;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      this.notifySubscribers();
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.currentToken = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.notifySubscribers();
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.currentUser = null;
          this.currentToken = null;
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          return null;
        }
        throw new Error('Failed to get current user');
      }

      const { user, token } = await response.json();
      this.currentUser = user;
      this.currentToken = token;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  public async getToken(): Promise<string | null> {
    // If we have a token and a user, return the token
    if (this.currentToken && this.currentUser) {
      return this.currentToken;
    }

    // If we have a user but no token, try to get a new token
    if (this.currentUser) {
      try {
        const response = await fetch(`${this.baseUrl}/auth/token`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            this.currentUser = null;
            this.currentToken = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return null;
          }
          throw new Error('Failed to get token');
        }

        const { token } = await response.json();
        this.currentToken = token;
        localStorage.setItem('token', token);
        return token;
      } catch (error) {
        console.error('Get token error:', error);
        return null;
      }
    }

    return null;
  }

  public subscribeToAuthChanges(callback: AuthChangeCallback): () => void {
    this.subscribers.add(callback);
    // Initial callback with current state
    callback(this.currentUser);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}

export const authService = AuthService.getInstance();
