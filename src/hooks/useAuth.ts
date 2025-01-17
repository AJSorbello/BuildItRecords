import { useState, useEffect } from 'react';
import { authService } from '../services/AuthService';

export interface User {
  id: string;
  uid: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const [user, token] = await Promise.all([
          authService.getCurrentUser(),
          authService.getToken()
        ]);
        
        if (mounted) {
          setState({
            user,
            token,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            user: null,
            token: null,
            loading: false,
            error: error as Error
          });
        }
      }
    };

    // Subscribe to auth changes
    const unsubscribe = authService.subscribeToAuthChanges(async (user) => {
      if (mounted) {
        const token = user ? await authService.getToken() : null;
        setState({
          user,
          token,
          loading: false,
          error: null
        });
      }
    });

    checkAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return state;
};
