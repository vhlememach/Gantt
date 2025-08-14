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

  // Function to check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Auth check successful:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      } else {
        console.log('Auth check failed:', response.status);
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status on mount with timeout
  useEffect(() => {
    checkAuth();
    
    // Fallback timeout to prevent infinite loading but be more lenient
    const timeout = setTimeout(() => {
      if (isLoading && !user) {
        console.log('Auth check timeout, marking as not loading');
        setIsLoading(false);
      }
    }, 15000); // 15 seconds max loading, and only if no user
    
    return () => clearTimeout(timeout);
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
    onSuccess: async (data) => {
      console.log('Login successful:', data);
      // Update the user state directly
      setUser(data.user);
      setIsAuthenticated(true);
      // Clear all cached data and refetch after a short delay
      queryClient.clear();
      
      // Double-check auth status after successful login
      setTimeout(() => {
        checkAuth();
      }, 100);
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
    isUnauthenticated: !isAuthenticated && !isLoading && !user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}