// src/context/SettingsContext.js
import React, { createContext, useState, useEffect } from "react";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    dbServer: "",
    dbPort: "",
    dbName: "",
    dbUser: "",
    dbPassword: "",
    barcodeTable: "",
    barcodeColumn: "",
    productCodeColumn: "",
    productsTable: "",
    productsCodeColumn: "",
    productsNameColumn: "",
    productsImageColumn: "",
    productsPrice1Column: "",
    productsPrice2Column: "",
    productsPrice3Column: "",
  });

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      console.log("Loading settings from localStorage");
      const storedSettings = localStorage.getItem("scanner_settings");
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        console.log("Found stored settings:", parsedSettings);
        setSettings(parsedSettings);
      } else {
        console.log("No stored settings found");
      }
    } catch (error) {
      console.error("Error parsing stored settings:", error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      console.log("Saving settings to localStorage:", settings);
      localStorage.setItem("scanner_settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  }, [settings]);

  // Function to update settings
  const updateSettings = (newSettings) => {
    console.log("Updating settings:", newSettings);
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
