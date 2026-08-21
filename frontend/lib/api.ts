import axios from 'axios';

// Base URL points to the NestJS backend
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }

  if (typeof window !== 'undefined') {
    console.error(
      'Configuration Error: NEXT_PUBLIC_API_URL is missing in production. ' +
      'Please configure NEXT_PUBLIC_API_URL in your Vercel project environment variables.'
    );
  }

  return '';
}

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach the JWT token to every request and prevent silent failure
api.interceptors.request.use(
  (config) => {
    // Fail clearly in production if NEXT_PUBLIC_API_URL is missing
    if (!config.baseURL && process.env.NODE_ENV === 'production') {
      return Promise.reject(
        new Error(
          'API configuration error: NEXT_PUBLIC_API_URL is not defined. ' +
          'Please set NEXT_PUBLIC_API_URL in your Vercel project environment variables.'
        )
      );
    }

    // We only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // If we get a 401, redirect to login unless we're already on a public page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && !window.location.pathname.startsWith('/signup')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
