// src/components/BarcodeScanner.js
import React, { useState, useEffect, useRef, useCallback } from "react";
// Import the ZXing library directly
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

  const videoRef = useRef(null);
  const readerRef = useRef(null);

  // Define startScanner with useCallback to prevent recreation on every render
  const startScanner = useCallback(
    async (facingMode) => {
      if (!videoRef.current || !readerRef.current) return;

      try {
        // Reset any previous scanning
        readerRef.current.reset();

        // Get video constraints
        const constraints = {
          video: {
            facingMode: facingMode,
          },
        };

        // Start continuous scanning
        await readerRef.current.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, error) => {
            if (result) {
              const barcodeValue = result.getText();

              // Prevent duplicate scans in quick succession
              const now = Date.now();
              if (
                barcodeValue !== lastScannedBarcode ||
                now - lastScannedTime > 2000
              ) {
                setLastScannedBarcode(barcodeValue);
                setLastScannedTime(now);
                onBarcodeScanned(barcodeValue);
              }
            }

            if (error && !(error instanceof TypeError)) {
              // Ignore expected ZXing errors during scanning
              if (
                !error.message.includes(
                  "No MultiFormat Readers were able to detect",
                )
              ) {
                console.error("Scanning error:", error);
              }
            }
          },
        );
      } catch (error) {
        console.error("Error starting scanner:", error);
        setError(`Scanner error: ${error.message}`);
      }
    },
    [lastScannedBarcode, lastScannedTime, onBarcodeScanned],
  );

  // Initialize scanner
  useEffect(() => {
    // Set up hints for barcode reader
    const hints = new Map();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ];

    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    // Create reader
    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    // Check for camera
    const checkCameraAvailability = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(
          (device) => device.kind === "videoinput",
        );

        if (!hasCamera) {
          setIsCameraAvailable(false);
          setError("No camera detected on this device");
          return;
        }

        // Try to get camera access
        try {
          // Start with environment camera if available (back camera)
          await startScanner("environment");
        } catch (envError) {
          console.warn("Could not access environment camera:", envError);

          try {
            // Fall back to any camera
            await startScanner("user");
          } catch (userError) {
            console.error("Could not access any camera:", userError);
            setIsCameraAvailable(false);
            setError(
              "Could not access camera. Please check permissions and try again.",
            );
          }
        }
      } catch (error) {
        console.error("Error checking camera:", error);
        setIsCameraAvailable(false);
        setError(`Camera error: ${error.message}`);
      }
    };

    checkCameraAvailability();

    // Cleanup
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [startScanner]); // Add startScanner as a dependency

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
        <video ref={videoRef} className="w-full h-64 object-cover" />

        <div
          className="absolute inset-0 border-4 border-blue-500 opacity-50 pointer-events-none"
          style={{ borderRadius: "2px" }}
        ></div>

        {/* Scanning line animation */}
        <div
          className="absolute left-0 w-full h-0.5 bg-red-500 opacity-80"
          style={{
            top: "50%",
            animation: "scanningAnimation 2s ease-in-out infinite alternate",
          }}
        ></div>
      </div>

      <div className="bg-blue-500 text-white p-2 text-center">
        <p>دوربین فعال - در حال اسکن...</p>
      </div>

      {/* Manual barcode input option */}
      <form
        onSubmit={handleManualSubmit}
        className="flex mt-2 border-t border-gray-200 pt-2"
      >
        <input
          type="text"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          placeholder="یا بارکد را اینجا وارد کنید"
          className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          جستجو
        </button>
      </form>
    </div>
  );
};

export default BarcodeScanner;
