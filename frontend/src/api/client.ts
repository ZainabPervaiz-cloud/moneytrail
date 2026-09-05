/**
 * Shared axios instance for every API call in the app.
 *
 * Two things happen here that every request benefits from automatically:
 *  1. Base URL is read from an env var, so dev/prod can point at
 *     different backends without touching component code.
 *  2. A request interceptor attaches the JWT (if we have one) to the
 *     Authorization header, so individual API modules never have to
 *     remember to do it themselves.
 */

import axios from "axios";

// Vite exposes env vars prefixed with VITE_ to the client bundle.
// Falls back to localhost so `npm run dev` works with zero config.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever says "your token is invalid/expired" (401), the
// cleanest recovery is to drop the stale token and send the user back
// to login rather than showing them a confusing error state.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
