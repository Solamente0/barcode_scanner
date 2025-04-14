import React, { useMemo, useState } from "react";

const ProductDisplay = ({ product, priceType, onPriceTypeChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!product) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-orange-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium">
            لطفا بارکد محصول را اسکن کنید
          </p>
        </div>
      </div>
    );
  }

  const handleImageError = (e) => {
    e.target.src = "/placeholder-image.png"; // Fallback image if product image fails to load
  };

  const bufferToBase64 = (buffer) => {
    if (!buffer || !buffer.data) return null;

    try {
      // Convert Buffer data to Uint8Array
      const uint8Array = new Uint8Array(buffer.data);

      // Use built-in browser method for base64 conversion
      return btoa(String.fromCharCode.apply(null, uint8Array));
    } catch (error) {
      console.error("Error converting buffer to base64:", error);
      return null;
    }
  };

  const imageSrc = useMemo(() => {
    if (product?.productImage) {
      // Check if it's already a string (URL or base64)
      if (typeof product.productImage === "string") {
        return product.productImage;
      }

      // Convert Buffer image to base64
      const base64Image = bufferToBase64(product.productImage);
      return base64Image
        ? `data:image/jpeg;base64,${base64Image}`
        : "/placeholder-image.png";
    } else {
      // Fallback
      return "/placeholder-image.png";
    }
  }, [product?.productImage]);

  // Rest of the component remains the same...
  const handlePriceTypeSelect = (type) => {
    onPriceTypeChange(type);
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    const intPrice = Math.floor(parseFloat(price));
    return intPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
      {/* Product Header Section */}
      <div className="p-4 flex items-center bg-gradient-to-r from-orange-50 to-white">
        {/* Product Image */}
        <div className="relative flex-shrink-0 w-28 h-28 mr-4 bg-white rounded-lg overflow-hidden shadow-md">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <svg
                className="animate-spin h-10 w-10 text-orange-500"
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
            src={imageSrc}
            alt={product.productName}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoading(false)}
            onError={handleImageError}
          />
        </div>

        {/* Rest of the component remains the same */}
        <div className="flex-grow text-right space-y-2">
          <div className="bg-orange-50 inline-block px-3 py-1 rounded-full">
            <span className="text-gray-600 text-sm ml-1">کد محصول:</span>
            <span className="font-semibold text-orange-800 dirRtl">
              {product.productCode}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800 line-clamp-2 mr-3 dirRtl">
              {product.productName}
            </h2>
          </div>
        </div>
      </div>

      {/* Price Display Section */}
      <div className="px-4 py-5 text-center bg-white">
        <div className="mb-1 text-xs font-medium text-gray-500">قیمت:</div>
        <div className="font-bold text-orange-700 text-4xl mb-3">
          {formatPrice(getCurrentPrice())}
          <span className="text-sm text-gray-500 mr-1">تومان</span>
        </div>
      </div>

      {/* Price Type Selector */}
      <div className="grid grid-cols-3 border-t border-gray-200">
        {[1, 2, 3].map((type) => (
          <button
            key={type}
            onClick={() => handlePriceTypeSelect(type)}
            className={`py-3 text-center transition-all duration-200 text-sm font-medium ${
              priceType === type
                ? "bg-orange-600 text-white shadow-inner"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductDisplay;
