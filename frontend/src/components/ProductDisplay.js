// src/components/ProductDisplay.js
import React, { useState } from "react";

const ProductDisplay = ({ product, priceType, onPriceTypeChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!product) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-gray-500">لطفا بارکد محصول را اسکن کنید</p>
      </div>
    );
  }

  const handleImageError = (e) => {
    e.target.src = "/placeholder-image.png"; // Fallback image if product image fails to load
  };

  // Handle price type selection
  const handlePriceTypeSelect = (type) => {
    onPriceTypeChange(type);
  };

  // Determine which price to show based on selected price type
  const getCurrentPrice = () => {
    switch (priceType) {
      case 1:
        return product.price1;
      case 2:
        return product.price2;
      case 3:
        return product.price3;
      default:
        return product.price1;
    }
  };

  // Format price with commas for thousands
  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 flex items-center">
        {/* Product Image */}
        <div className="relative flex-shrink-0 w-32 h-32 mr-4 bg-gray-100 rounded overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <svg
                className="animate-spin h-8 w-8 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
          <img
            src={product.productImage || "/placeholder-image.png"}
            alt={product.productName}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoading(false)}
            onError={handleImageError}
          />
        </div>

        {/* Product Info */}
        <div className="flex-grow text-right">
          <div>
            <span className="text-gray-600 text-sm">کدمحصول:</span>
            <span className="mr-2 font-semibold text-sm dirRtl">
              {product.productCode}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-gray-600 text-sm">نام محصول:</span>
            <span className="mr-2 font-semibold">{product.productName}</span>
          </div>

          <div className="mt-2">
            <span className="text-gray-600 text-sm">قیمت:</span>
            <span className="mr-2 font-bold text-blue-600">
              {formatPrice(getCurrentPrice())}
            </span>
          </div>
        </div>
      </div>

      {/* Price Type Selector */}
      <div className="flex border-t border-gray-200">
        <button
          onClick={() => handlePriceTypeSelect(1)}
          className={`flex-1 py-2 text-center text-sm ${priceType === 1 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          ۱
        </button>
        <button
          onClick={() => handlePriceTypeSelect(2)}
          className={`flex-1 py-2 text-center text-sm ${priceType === 2 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          ۲
        </button>
        <button
          onClick={() => handlePriceTypeSelect(3)}
          className={`flex-1 py-2 text-center text-sm ${priceType === 3 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          ۳
        </button>
      </div>
    </div>
  );
};

export default ProductDisplay;
