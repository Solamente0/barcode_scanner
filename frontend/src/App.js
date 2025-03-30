// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import ScannerPage from './pages/ScannerPage';
import SettingsPage from './pages/SettingsPage';
import './styles.css';

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-gray-100">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<ScannerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
