import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstTimeSetup: boolean | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  setupAdmin: (data: RegisterData) => Promise<void>;
  checkFirstTimeSetup: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9825';

// Configure axios defaults
axios.defaults.baseURL = API_BASE;

// Add token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState<boolean | null>(null);

  // Check if this is first time setup
  const checkFirstTimeSetup = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.get('/api/auth/check-setup');
      const isFirstTime = response.data.data.isFirstTimeSetup;
      setIsFirstTimeSetup(isFirstTime);
      return isFirstTime;
    } catch (error) {
      console.error('Failed to check first time setup:', error);
      setIsFirstTimeSetup(true);
      return true;
    }
  }, []);

  // Setup admin (first time only)
  const setupAdmin = async (data: RegisterData) => {
    try {
      const response = await axios.post('/api/auth/setup-admin', data);
      const { user, tokens } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      setUser(user);
      setIsFirstTimeSetup(false);
    } catch (error: any) {
      console.error('Setup admin error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create admin account');
    }
  };

  // Login
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { user, tokens } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      setUser(user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Invalid username or password');
    }
  };

  // Register
  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post('/api/auth/register', data);
      const { user, tokens } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      setUser(user);
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/auth/refresh-token', {
        refreshToken: storedRefreshToken
      });

      const { tokens } = response.data.data;

      // Update tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout
      await logout();
    }
  };

  // Get current user profile
  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get('/api/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Get current user error:', error);
      // If getting user fails, try to refresh token
      try {
        await refreshToken();
        // Retry getting user
        const response = await axios.get('/api/auth/me');
        setUser(response.data.data.user);
      } catch (refreshError) {
        console.error('Failed to refresh and get user:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Setup axios response interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await refreshToken();
            // Retry the original request with new token
            const token = localStorage.getItem('accessToken');
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkFirstTimeSetup();
      await getCurrentUser();
    };
    initAuth();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isFirstTimeSetup,
    login,
    logout,
    register,
    setupAdmin,
    checkFirstTimeSetup,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
