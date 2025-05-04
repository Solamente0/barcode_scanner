// src/services/api.js
import axios from "axios";

const getApiBaseUrl = () => {
  try {
    const storedSettings = localStorage.getItem("scanner_settings");
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      let serverUrl = process.env.REACT_APP_API_URL.replace(/^https?:\/\//, "");
      const parts = serverUrl.split(":");
      const server = settings.apiServer || parts[0] || "localhost";
      const port = settings.apiPort || parts[1] || "5000";

      return `https://${server}:${port}/api`;
    }
  } catch (error) {
    console.error("Error getting API settings:", error);
  }
  return "http://localhost:5000/api";
};

// Get base URL from environment or default to localhost
const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for CORS with credentials
});

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);

    // Network errors won't have a response
    if (!error.response) {
      return Promise.reject({
        status: "error",
        message:
          "Network error - Please check if the server is running and accessible",
        originalError: error.message,
      });
    }

    return Promise.reject(
      error.response?.data || {
        status: "error",
        message: error.message || "Unknown error occurred",
      },
    );
  },
);

// API methods
export const apiService = {
  // Test database connection
  updateBaseUrl: () => {
    api.defaults.baseURL = getApiBaseUrl();
  },
  // Add this method to the apiService object in src/services/api.js
  testApiConnection: async (serverAddress, serverPort) => {
    try {
      // Build a temporary URL for testing
      // const testUrl = `https://${serverAddress}:${serverPort}/api/ping`;
      const testUrl = `http://${serverAddress}:${serverPort}/api/ping`;

      console.log("Testing API connection at:", testUrl);

      // Create a temporary axios instance to avoid modifying the main one
      const testApi = axios.create({
        timeout: 5000, // 5 second timeout for quick feedback
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await testApi.get(testUrl);
      return {
        success: true,
        message: "اتصال به سرور API با موفقیت انجام شد.",
        data: response.data,
      };
    } catch (error) {
      console.error("API connection test failed:", error);
      let errorMessage = "خطا در اتصال به سرور API";

      if (error.code === "ECONNREFUSED") {
        errorMessage =
          "عدم دسترسی به سرور: اطمینان حاصل کنید سرور در حال اجرا است.";
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "زمان اتصال به پایان رسید: سرور پاسخ نمی‌دهد.";
      } else if (error.response) {
        errorMessage = `خطای سرور: ${error.response.status} - ${error.response.statusText}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  testConnection: async (connectionData) => {
    try {
      const response = await api.post("/test-connection", connectionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Save settings
  saveSettings: async (settingsData) => {
    try {
      const response = await api.post("/settings", settingsData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get settings
  getSettings: async () => {
    try {
      const response = await api.get("/settings");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get product by barcode
  getProductByBarcode: async (barcode) => {
    try {
      const response = await api.get(`/product/${barcode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiService;
