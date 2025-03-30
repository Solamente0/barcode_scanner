// src/context/SettingsContext.js
import React, { createContext, useState, useEffect } from 'react';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    dbServer: '',
    dbPort: '',
    dbName: '',
    dbUser: '',
    dbPassword: '',
    barcodeTable: '',
    barcodeColumn: '',
    productCodeColumn: '',
    productsTable: '',
    productsCodeColumn: '',
    productsNameColumn: '',
    productsImageColumn: '',
    productsPrice1Column: '',
    productsPrice2Column: '',
    productsPrice3Column: ''
  });

  // Load settings from localStorage on initial render
  useEffect(() => {
    const storedSettings = localStorage.getItem('scanner_settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (error) {
        console.error('Error parsing stored settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    console.log("hey, line 39", settings);
    
    localStorage.setItem('scanner_settings', JSON.stringify(settings));
  }, [settings]);

  // Function to update settings
  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
