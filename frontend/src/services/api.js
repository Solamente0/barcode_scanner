// src/services/api.js
import axios from "axios";

// Get base URL from environment or default to localhost
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method.toUpperCase()} request to ${config.url}`,
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API error:", error);
    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        message: "Request timeout. Please check your connection.",
      });
    }

    if (!error.response) {
      return Promise.reject({
        message:
          "Cannot connect to server. Please check if the backend is running.",
      });
    }

    return Promise.reject(error.response?.data || error);
  },
);

// API methods
export const apiService = {
  // Test database connection
  testConnection: async (connectionData) => {
    try {
      const response = await api.post("/test-connection", connectionData);
      return response.data;
    } catch (error) {
      console.error("Test connection error:", error);
      throw error;
    }
  },

  // Save settings
  saveSettings: async (settingsData) => {
    try {
      console.log("Saving settings:", settingsData);
      const response = await api.post("/settings", settingsData);
      return response.data;
    } catch (error) {
      console.error("Save settings error:", error);
      throw error;
    }
  },

  // Get settings
  getSettings: async () => {
    try {
      const response = await api.get("/settings");
      return response.data;
    } catch (error) {
      console.error("Get settings error:", error);
      throw error;
    }
  },

  // Get product by barcode
  getProductByBarcode: async (barcode) => {
    try {
      const response = await api.get(`/product/${barcode}`);
      return response.data;
    } catch (error) {
      console.error("Get product error:", error);
      throw error;
    }
  },
};
