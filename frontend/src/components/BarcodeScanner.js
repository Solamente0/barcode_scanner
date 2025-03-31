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
          if (result) {
            console.log("Barcode detected:", result);
            const barcodeValue = result.getText();

            // More permissive duplicate handling (500ms cooldown)
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
        setError(`Camera error: ${err.message || "Could not access camera"}`);
      }
    }
  }, [cameraFacingMode, lastScannedBarcode, lastScannedTime, onBarcodeScanned]);

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
      <div className="rounded-lg overflow-hidden">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
          <p className="text-yellow-700 font-semibold">
            {error || "دوربین در دسترس نیست"}
          </p>
          <p className="text-gray-700 mt-2">
            لطفا بارکد را بصورت دستی وارد کنید یا اطمینان حاصل کنید که دستگاه
            شما دوربین دارد و دسترسی به آن داده شده است.
          </p>
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col">
          <div className="flex">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="بارکد را اینجا وارد کنید"
              className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              جستجو
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-32 object-cover" /* MODIFIED: reduced height from h-64 to h-48 */
          autoPlay
          playsInline
          muted
        />

        <div
          className="absolute inset-0 border-4 border-blue-500 opacity-50 pointer-events-none"
          style={{ borderRadius: "2px" }}
        ></div>

        {/* Scanning line animation */}
        <div className="scanning-line"></div>

        {/* Camera toggle button */}
        <button
          onClick={toggleCamera}
          className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full opacity-80 hover:opacity-100"
          aria-label="Toggle camera"
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

        {/* Restart button in case of issues */}
        <button
          onClick={() => startScanner()}
          className="absolute bottom-2 left-2 bg-green-600 text-white p-2 rounded-full opacity-80 hover:opacity-100"
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

      <div className="bg-blue-600 text-white p-1 text-center text-sm">
        {" "}
        {/* MODIFIED: reduced padding and text size */}
        <p>دوربین فعال - در حال اسکن...</p>
      </div>

      {/* Manual barcode input option */}
      <form
        onSubmit={handleManualSubmit}
        className="flex mt-1 border-t border-gray-200 pt-1" /* MODIFIED: reduced margins */
      >
        <input
          type="text"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          placeholder="یا بارکد را اینجا وارد کنید"
          className="flex-1 p-1 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500" /* MODIFIED: reduced padding */
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-3 py-1 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500" /* MODIFIED: reduced padding */
        >
          جستجو
        </button>
      </form>
    </div>
  );
};

export default BarcodeScanner;
