// src/components/BarcodeScanner.js
import React, { useEffect, useState } from 'react';
import { useZxing } from 'react-zxing';

const BarcodeScanner = ({ onBarcodeScanned }) => {
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  
  const { ref } = useZxing({
    onDecodeResult(result) {
      const barcodeValue = result.getText();
      if (barcodeValue) {
        onBarcodeScanned(barcodeValue);
      }
    }
  });

  // Check camera availability on component mount
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setIsCameraAvailable(hasCamera);
      } catch (error) {
        console.error('Error checking camera availability:', error);
        setIsCameraAvailable(false);
      }
    };

    checkCameraAvailability();
  }, []);

  if (!isCameraAvailable) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-100 rounded-lg">
        <p className="text-red-600 font-semibold text-lg mb-2">
          Camera not available
        </p>
        <p className="text-center text-gray-700">
          Please make sure your device has a camera and you've granted permission to access it.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-blue-500 rounded-lg overflow-hidden">
      <div className="relative">
        <video 
          ref={ref} 
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 border-4 border-blue-500 opacity-50 pointer-events-none" style={{ borderRadius: '2px' }}></div>
      </div>
      <div className="bg-blue-500 text-white p-2 text-center">
        <p>دوربین فعال - در حال اسکن...</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
