import axios from 'axios';
import { refreshTokens, isTokenExpired } from './auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token and auto-refresh if expired
api.interceptors.request.use(
  async (config) => {
    // Prefer the id_token (JWT containing user identity claims) for API Gateway
    // Cognito authorizers commonly validate the ID token's claims. Fall back to
    // access_token when id_token is absent to preserve compatibility.
    let idToken = localStorage.getItem('id_token');
    let accessToken = localStorage.getItem('access_token');
    let tokenToUse = idToken && idToken.trim() !== '' ? idToken : accessToken;

    // If token exists and is expired, refresh it
    if (tokenToUse && isTokenExpired(tokenToUse)) {
      console.log('[API] Token expired, refreshing...');
      try {
        await refreshTokens();
        // Get refreshed tokens
        idToken = localStorage.getItem('id_token');
        accessToken = localStorage.getItem('access_token');
        tokenToUse = idToken && idToken.trim() !== '' ? idToken : accessToken;
        console.log('[API] Token refreshed successfully');
      } catch (refreshErr) {
        console.error('[API] Refresh failed:', refreshErr);
        // If refresh fails, redirect to login or reject
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired, please login again'));
      }
    }

    if (tokenToUse && tokenToUse.trim() !== '') {
      config.headers.Authorization = `Bearer ${tokenToUse}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
