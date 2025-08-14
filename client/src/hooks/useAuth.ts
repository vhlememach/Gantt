import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<LoginResponse> => {
      const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update the user state directly
      setUser(data.user);
      setIsAuthenticated(true);
      // Clear all cached data and refetch
      queryClient.clear();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      // Clear user state and cached data
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      window.location.reload();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated,
    isUnauthenticated: !isAuthenticated && !isLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}