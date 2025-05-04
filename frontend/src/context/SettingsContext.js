// src/context/SettingsContext.js
import React, { createContext, useState, useEffect } from "react";

export const SettingsContext = createContext();

// Default PostgreSQL settings
const defaultSettings = {
  // API Details:
  apiServer: "localhost",
  apiPort: "5000",
  // DB Details:
  dbServer: "localhost",
  dbPort: "5432",
  dbName: "barcode_scanner",
  dbUser: "postgres",
  dbPassword: "",
  // TABLE & Column Details
  barcodeTable: "barcodes",
  barcodeColumn: "barcode",
  productCodeColumn: "product_code",
  productsTable: "products",
  productsCodeColumn: "product_code",
  productsNameColumn: "product_name",
  productsImageColumn: "product_image",
  productsPrice1Column: "price1",
  productsPrice2Column: "price2",
  productsPrice3Column: "price3",
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on initial render only
  useEffect(() => {
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem("scanner_settings");
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          // Merge with default settings to ensure all properties exist
          setSettings({ ...defaultSettings, ...parsedSettings });
        }
      } catch (error) {
        console.error("Error loading stored settings:", error);
        // If there's an error, fallback to default settings
        setSettings(defaultSettings);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []); // Empty dependency array means this runs once on mount

  // Save settings to localStorage whenever they change
  useEffect(() => {
    // Only save after initial load is complete to prevent overwriting with defaults
    if (isLoaded) {
      try {
        localStorage.setItem("scanner_settings", JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving settings to localStorage:", error);
      }
    }
  }, [settings, isLoaded]);

  // Function to update settings
  const updateSettings = (newSettings) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // Reset settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
