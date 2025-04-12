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
  useEffect(() => {
    if (isLoaded && areSettingsConfigured()) {
      // Refresh the API service to use the new server/port settings
      apiService.updateBaseUrl();
    }
  }, [settings, isLoaded, areSettingsConfigured]);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          رفتن به صفحه تنظیمات
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-2" style={{ direction: "rtl" }}>
      {" "}
      {/* MODIFIED: reduced padding from p-4 to px-2 py-2 */}
      <div className="mb-2">
        {" "}
        {/* MODIFIED: reduced margin from mb-6 to mb-3 */}
        <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center p-4">
          {" "}
          {/* MODIFIED: reduced padding from p-8 to p-4 */}
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>{" "}
          {/* MODIFIED: reduced size from h-12 w-12 to h-10 w-10 */}
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3">
          {" "}
          {/* MODIFIED: reduced padding from p-4 to p-3 */}
          <p>{error}</p>
          <p className="mt-1 text-sm">بارکد: {lastScannedBarcode}</p>{" "}
          {/* MODIFIED: reduced margin from mt-2 to mt-1 */}
        </div>
      ) : (
        <ProductDisplay
          product={product}
          priceType={priceType}
          onPriceTypeChange={handlePriceTypeChange}
        />
      )}
      {/* Database connection info - MODIFIED: reduced margin and made text smaller */}
      <div className="mt-2 p-1 text-xs text-right text-gray-500">
        {" "}
        {/* MODIFIED: reduced margin from mt-4 to mt-2 and padding from p-2 to p-1 */}
        <p>
          اتصال به: {settings.dbServer} / {settings.dbName}
        </p>
      </div>
    </div>
  );
};

export default ScannerPage;
