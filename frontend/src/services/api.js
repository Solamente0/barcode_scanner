// src/services/api.js
import axios from 'axios';

// Get base URL from environment or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods
export const apiService = {
  // Test database connection
  testConnection: async (connectionData) => {
    try {
      const response = await api.post('/test-connection', connectionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Save settings
  saveSettings: async (settingsData) => {
    try {
      const response = await api.post('/settings', settingsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get settings
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get product by barcode
  getProductByBarcode: async (barcode) => {
    try {
      const response = await api.get(`/product/${barcode}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
