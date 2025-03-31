// src/pages/ScannerPage.js
import React, { useState, useContext, useEffect, useCallback } from "react";
import BarcodeScanner from "../components/BarcodeScanner";
import ProductDisplay from "../components/ProductDisplay";
import { SettingsContext } from "../context/SettingsContext";
import { apiService } from "../services/api";
import { useNavigate } from "react-router-dom";

const ScannerPage = () => {
  const { settings, isLoaded } = useContext(SettingsContext);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [priceType, setPriceType] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState(0);
  const navigate = useNavigate();

  // Function to check if settings are configured
  const areSettingsConfigured = useCallback(() => {
    if (!isLoaded) return false; // Don't check until settings are loaded

    return (
      settings.dbServer &&
      settings.dbName &&
      settings.dbUser &&
      settings.dbPassword &&
      settings.productsTable
    );
  }, [settings, isLoaded]);

  // Redirect to settings page if not configured
  useEffect(() => {
    if (isLoaded && !areSettingsConfigured()) {
      navigate("/settings");
    }
  }, [areSettingsConfigured, navigate, isLoaded]);

  // Handle keyboard input for price type selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "1") {
        setPriceType(1);
      } else if (e.key === "2") {
        setPriceType(2);
      } else if (e.key === "3") {
        setPriceType(3);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle barcode scan
  const handleBarcodeScanned = async (barcode) => {
    // Prevent duplicate scans in quick succession (within 2 seconds)
    if (
      barcode === lastScannedBarcode &&
      Date.now() - lastScannedTimestamp < 2000
    ) {
      return;
    }

    setLastScannedBarcode(barcode);
    setLastScannedTimestamp(Date.now());
    setError("");
    setIsLoading(true);

    try {
      const result = await apiService.getProductByBarcode(barcode);
      if (result.status === "success") {
        setProduct(result.data);
      } else {
        setError("محصول پیدا نشد");
        setProduct(null);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err.message || "خطا در بازیابی اطلاعات محصول");
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle price type change
  const handlePriceTypeChange = (type) => {
    setPriceType(type);
  };

  // If settings aren't loaded yet, show loading indicator
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If settings aren't configured, show message
  if (!areSettingsConfigured()) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>
            تنظیمات اتصال به دیتابیس انجام نشده است. لطفا ابتدا تنظیمات را انجام
            دهید.
          </p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          رفتن به صفحه تنظیمات
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4" style={{ direction: "rtl" }}>
      <div className="mb-6">
        <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
          <p className="mt-2 text-sm">بارکد: {lastScannedBarcode}</p>
        </div>
      ) : (
        <ProductDisplay
          product={product}
          priceType={priceType}
          onPriceTypeChange={handlePriceTypeChange}
        />
      )}

      {/* Price type usage instructions */}
      <div className="mt-6 bg-gray-100 rounded-lg p-4 text-sm text-gray-700">
        <p>برای تغییر نوع قیمت:</p>
        <ul className="mt-2 list-disc list-inside">
          <li>کلید 1 را برای قیمت نوع 1 فشار دهید</li>
          <li>کلید 2 را برای قیمت نوع 2 فشار دهید</li>
          <li>کلید 3 را برای قیمت نوع 3 فشار دهید</li>
        </ul>
      </div>

      {/* Database connection info */}
      <div className="mt-4 p-2 text-xs text-right text-gray-500">
        <p>
          اتصال به: {settings.dbServer} / {settings.dbName}
        </p>
      </div>
    </div>
  );
};

export default ScannerPage;
