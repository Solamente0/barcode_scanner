// src/components/BarcodeScanner.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";

const BarcodeScanner = ({ onBarcodeScanned }) => {
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const [error, setError] = useState(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");
  const [lastScannedTime, setLastScannedTime] = useState(0);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const [isScanning, setIsScanning] = useState(true);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Start scanner function wrapped in useCallback to prevent infinite loops
  const startScanner = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current) return;

    try {
      // Reset previous scanning
      codeReaderRef.current.reset();

      // Define camera constraints - using lower resolution for faster processing
      // and adding torch/flash if available for better scanning in low light
      const constraints = {
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 640 }, // Lower resolution for faster processing
          height: { ideal: 480 }, // Lower resolution for faster processing
          advanced: [{ torch: true }], // Turn on flash/torch if available
        },
      };

      console.log(
        "Starting barcode scanner with facing mode:",
        cameraFacingMode,
      );

      // Start continuous scanning with better error handling and debug logging
      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, error) => {
          if (!isScanning) return;

          if (result) {
            console.log("Barcode detected:", result);
            let barcodeValue = result.getText();
            if (barcodeValue.endsWith("q")) {
              barcodeValue = barcodeValue.slice(0, -1);
            } // More permissive duplicate handling (500ms cooldown)
            const now = Date.now();
            if (
              barcodeValue !== lastScannedBarcode ||
              now - lastScannedTime > 500
            ) {
              console.log("Processing barcode:", barcodeValue);
              setLastScannedBarcode(barcodeValue);
              setLastScannedTime(now);
              onBarcodeScanned(barcodeValue);
            }
          }

          // Only log real errors, not normal "no barcode found" errors
          if (
            error &&
            !(error instanceof TypeError) &&
            !error.message.includes("No MultiFormat Readers")
          ) {
            console.error("Scanning error:", error);
          }
        },
      );

      setIsCameraAvailable(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start scanner:", err);

      // Try fallback to other camera if this is the first attempt
      if (cameraFacingMode === "environment") {
        setCameraFacingMode("user");
        // We don't call startScanner directly to avoid potential issues
        // It will be triggered by the useEffect when cameraFacingMode changes
      } else {
        setIsCameraAvailable(false);
        setError(`خطای دوربین: ${err.message || "دسترسی به دوربین ممکن نیست"}`);
      }
    }
  }, [
    cameraFacingMode,
    lastScannedBarcode,
    lastScannedTime,
    onBarcodeScanned,
    isScanning,
  ]);

  // Initialize scanner with more inclusive settings
  useEffect(() => {
    // Configure settings for barcode reader with expanded format support
    const hints = new Map();
    const formats = [
      // 1D product barcodes
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      // 1D industrial barcodes
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
      // 2D barcodes
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.AZTEC,
    ];

    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.ASSUME_GS1, false);

    // Create reader with more inclusive settings and faster scanning rate
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 50,
    });
    codeReaderRef.current = reader;

    // Cleanup function
    const currentReader = codeReaderRef.current;
    return () => {
      if (currentReader) {
        currentReader.reset();
      }
    };
  }, []);

  // Effect to start scanner when camera mode changes or when first mounted
  useEffect(() => {
    startScanner();
  }, [startScanner]);

  // Handle camera switching
  const toggleCamera = () => {
    const newMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(newMode);
    // No need to call startScanner here as the useEffect will handle it
  };

  // Toggle scanning pause/resume
  const toggleScanning = () => {
    setIsScanning(!isScanning);
  };

  // Handle manual barcode input
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onBarcodeScanned(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  // If camera is not available, show manual input only
  if (!isCameraAvailable || error) {
    return (
      <div className="rounded-lg overflow-hidden shadow-lg bg-white border border-gray-200">
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 mb-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="mr-3">
              <p className="text-yellow-700 font-medium text-base">
                {error || "دوربین در دسترس نیست"}
              </p>
              <p className="text-yellow-600 mt-1 text-sm">
                لطفا بارکد را بصورت دستی وارد کنید یا اطمینان حاصل کنید که
                دستگاه شما دوربین دارد و دسترسی به آن داده شده است.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="px-4 pb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="manualBarcode"
          >
            ورود بارکد بصورت دستی:
          </label>
          <div className="flex">
            <input
              id="manualBarcode"
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="بارکد را اینجا وارد کنید"
              className="flex-1 p-3 border border-gray-300 rounded-r focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              dir="ltr"
            />
            <button
              type="submit"
              className="bg-orange-600 text-white px-6 py-3 rounded-l hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200"
            >
              جستجو
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg bg-white border border-gray-200">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-32 object-cover"
          autoPlay
          playsInline
          muted
        />

        {/*<div className="absolute inset-0 flex items-center justify-center">*/}
        {/*  <div className="w- h-32 border-2 border-orange-500 rounded-lg opacity-80 pulse"></div>*/}
        {/*</div>*/}

        {/* Scanning line animation */}
        {isScanning && <div className="scanning-line"></div>}

        {/* Action buttons */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {/* Camera toggle button */}
          <button
            onClick={toggleCamera}
            className="bg-white text-orange-600 p-3 rounded-full shadow-lg hover:bg-orange-50 transition-colors duration-200"
            aria-label="Toggle camera"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6" // Changed from w-6 h-6
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Toggle scanning button */}
          <button
            onClick={toggleScanning}
            className={`p-3 rounded-full shadow-lg transition-colors duration-200 ${
              isScanning
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
            aria-label={isScanning ? "Pause scanning" : "Resume scanning"}
          >
            {isScanning ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>

          {/* Restart button */}
          <button
            onClick={() => startScanner()}
            className="bg-white text-orange-600 p-3 rounded-full shadow-lg hover:bg-orange-50 transition-colors duration-200"
            aria-label="Restart scanner"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`py-1 px-3 text-center text-white font-medium ${isScanning ? "bg-orange-600" : "bg-gray-500"}`}
      >
        <p>
          {isScanning
            ? "دوربین فعال - در حال اسکن..."
            : "اسکن متوقف شده - کلیک کنید تا ادامه دهید"}
        </p>
      </div>

      {/* Manual barcode input option */}
      <form
        onSubmit={handleManualSubmit}
        className="p-1 border-t border-gray-200" // Changed from p-2
      >
        <div className="flex">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="یا بارکد را اینجا وارد کنید"
            className="flex-1 py-1 px-2 border border-gray-300 rounded-r focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            dir="ltr"
          />
          <button
            type="submit"
            className="bg-orange-600 text-white px-4 py-2 rounded-l hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200"
          >
            جستجو
          </button>
        </div>
      </form>
    </div>
  );
};

export default BarcodeScanner;
