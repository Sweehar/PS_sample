import axios from "axios";
import Cookie from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout for faster failure detection
});

// Simple in-memory cache for reducing latency
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds cache

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Cached GET request helper
const cachedGet = async (url, forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCached(url);
    if (cached) return cached;
  }
  const response = await api.get(url);
  setCache(url, response);
  return response;
};

// Clear cache for specific endpoints or all
export const clearCache = (key = null) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// API Endpoints
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => {
    clearCache();
    return api.post("/auth/login", data);
  },
  logout: () => {
    clearCache();
    return api.post("/auth/logout");
  },
  isAuthenticated: () => api.post("/auth/is-auth"),
  sendVerifyOtp: (userId) => api.post("/auth/send-verify-otp", { userId }),
  verifyEmail: (userId, otp) => api.post("/auth/verify-email", { userId, otp }),
  sendResetOtp: (email) => api.post("/auth/send-reset-otp", { email }),
  resetPassword: (email, otp, newPassword) =>
    api.post("/auth/reset-password", { email, otp, newPassword }),
};

export const userAPI = {
  getUserData: (userId) => api.post("/user/get-user-data", { userId }),
  getAllUsers: () => api.get("/user/all"),
  updateProfile: (data) => api.put("/user/profile", data),
  changePassword: (currentPassword, newPassword) =>
    api.put("/user/password", { currentPassword, newPassword }),
  updateNotifications: (notifications) =>
    api.put("/user/notifications", { notifications }),
  inviteUser: (email, role) => api.post("/user/invite", { email, role }),
  updateUserRole: (userId, role) => api.put(`/user/${userId}/role`, { role }),
  heartbeat: () => api.post("/user/heartbeat"),
  // Rating endpoints
  submitRating: (rating, message) =>
    api.post("/user/rating", { rating, message }),
  getMyRating: () => api.get("/user/rating"),
};

export const feedbackAPI = {
  submit: (text, metadata = {}) => {
    clearCache("/feedback/stats"); // Clear stats cache after new submission
    return api.post("/feedback/submit", { text, metadata });
  },
  getResult: (jobId) => api.get(`/feedback/result/${jobId}`),
  getHistory: (page = 1, limit = 10) =>
    api.get(`/feedback/history?page=${page}&limit=${limit}`),
  getStats: (forceRefresh = false) =>
    cachedGet("/feedback/stats", forceRefresh),
  getRatingStats: () => cachedGet("/feedback/rating-stats"),
  getHealth: () => api.get("/feedback/health"),
  clearHistory: () => {
    clearCache();
    return api.delete("/feedback/clear");
  },
};

export const adminAPI = {
  getStats: (forceRefresh = false) => cachedGet("/admin/stats", forceRefresh),
  getUsers: (page = 1, limit = 10, search = "") =>
    api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`),
  deleteUser: (userId) => {
    clearCache();
    return api.delete(`/admin/users/${userId}`);
  },
  updateUserRole: (userId, role) => {
    clearCache();
    return api.put(`/admin/users/${userId}/role`, { role });
  },
  getFeedback: (page = 1, limit = 10) =>
    api.get(`/admin/feedback?page=${page}&limit=${limit}`),
  getHealth: () => api.get("/admin/health"),
  controlDocker: (action) => api.post(`/admin/docker/${action}`),
  // User ratings
  getUserRatings: (page = 1, limit = 10) =>
    api.get(`/admin/user-ratings?page=${page}&limit=${limit}`),
};

// Public API (no auth required)
export const publicAPI = {
  getStats: () => cachedGet("/public/stats"),
};

export default api;
