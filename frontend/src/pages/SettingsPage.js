// src/pages/SettingsPage.js
import React, { useState, useContext, useRef, useEffect } from "react";
import { SettingsContext } from "../context/SettingsContext";
import { apiService } from "../services/api";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [formData, setFormData] = useState({ ...settings });
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const formRef = useRef(null);
  const navigate = useNavigate();

  // Initialize with default PostgreSQL port if empty
  useEffect(() => {
    if (!formData.dbPort) {
      setFormData((prev) => ({ ...prev, dbPort: "5432" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on component mount

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Test database connection
  const handleTestConnection = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);
    setErrorMessage("");

    try {
      const connectionData = {
        dbServer: formData.dbServer,
        dbPort: formData.dbPort || "5432",
        dbName: formData.dbName,
        dbUser: formData.dbUser,
        dbPassword: formData.dbPassword,
      };

      // Using result indirectly through setTestResult
      await apiService.testConnection(connectionData);
      setTestResult({
        success: true,
        message: "اتصال به دیتابیس با موفقیت انجام شد.",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `خطا در اتصال به دیتابیس: ${error.message || "خطای نامشخص"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Save to context first (which saves to localStorage)
      updateSettings(formData);

      // Then save to backend
      await apiService.saveSettings(formData);

      setSuccessMessage("تنظیمات با موفقیت ذخیره شد.");

      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      setErrorMessage(
        `خطا در ذخیره تنظیمات: ${error.message || "خطای نامشخص"}`,
      );
      // Keep settings in localStorage even if backend save fails
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4" style={{ direction: "rtl" }}>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          تنظیمات اتصال به دیتابیس
        </h2>

        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            {errorMessage}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Database Connection Settings */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              اطلاعات اولیه دیتابیس PostgreSQL
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dbServer"
                >
                  آیپی / هاست
                </label>
                <input
                  type="text"
                  id="dbServer"
                  name="dbServer"
                  value={formData.dbServer}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="localhost"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dbPort"
                >
                  پورت
                </label>
                <input
                  type="text"
                  id="dbPort"
                  name="dbPort"
                  value={formData.dbPort}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="5432"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dbName"
                >
                  نام دیتابیس
                </label>
                <input
                  type="text"
                  id="dbName"
                  name="dbName"
                  value={formData.dbName}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="barcode_scanner"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dbUser"
                >
                  یوزر
                </label>
                <input
                  type="text"
                  id="dbUser"
                  name="dbUser"
                  value={formData.dbUser}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="postgres"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dbPassword"
                >
                  پسورد
                </label>
                <input
                  type="password"
                  id="dbPassword"
                  name="dbPassword"
                  value={formData.dbPassword}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isLoading ? "در حال تست..." : "تست اتصال"}
              </button>

              {testResult && (
                <div
                  className={`mt-2 p-2 rounded ${testResult.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Barcode Table Settings */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              اطلاعات جدول بارکد
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="barcodeTable"
                >
                  نام جدول
                </label>
                <input
                  type="text"
                  id="barcodeTable"
                  name="barcodeTable"
                  value={formData.barcodeTable}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="barcodes"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="barcodeColumn"
                >
                  نام ستون بارکد
                </label>
                <input
                  type="text"
                  id="barcodeColumn"
                  name="barcodeColumn"
                  value={formData.barcodeColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="barcode"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productCodeColumn"
                >
                  نام ستون کدمحصول
                </label>
                <input
                  type="text"
                  id="productCodeColumn"
                  name="productCodeColumn"
                  value={formData.productCodeColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="product_code"
                />
              </div>
            </div>
          </div>

          {/* Products Table Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              اطلاعات جدول محصولات
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productsTable"
                >
                  نام جدول
                </label>
                <input
                  type="text"
                  id="productsTable"
                  name="productsTable"
                  value={formData.productsTable}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="products"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productsCodeColumn"
                >
                  نام ستون کدمحصول
                </label>
                <input
                  type="text"
                  id="productsCodeColumn"
                  name="productsCodeColumn"
                  value={formData.productsCodeColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="product_code"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productsNameColumn"
                >
                  نام ستون اسم محصول
                </label>
                <input
                  type="text"
                  id="productsNameColumn"
                  name="productsNameColumn"
                  value={formData.productsNameColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="product_name"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productsImageColumn"
                >
                  نام ستون عکس محصول
                </label>
                <input
                  type="text"
                  id="productsImageColumn"
                  name="productsImageColumn"
                  value={formData.productsImageColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="product_image"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productsPrice1Column"
                >
                  نام ستون تیپ قیمت 1
                </label>
                <input
                  type="text"
                  id="productsPrice1Column"
                  name="productsPrice1Column"
                  value={formData.productsPrice1Column}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="price1"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productsPrice2Column"
                >
                  نام ستون تیپ قیمت 2
                </label>
                <input
                  type="text"
                  id="productsPrice2Column"
                  name="productsPrice2Column"
                  value={formData.productsPrice2Column}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="price2"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productsPrice3Column"
                >
                  نام ستون تیپ قیمت 3
                </label>
                <input
                  type="text"
                  id="productsPrice3Column"
                  name="productsPrice3Column"
                  value={formData.productsPrice3Column}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="price3"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              بازگشت
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isLoading ? "در حال ذخیره..." : "ذخیره تنظیمات"}
            </button>
          </div>
        </form>
      </div>

      {/* Default Settings Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          تنظیمات پیش‌فرض PostgreSQL
        </h2>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            اطلاعات نمونه برای اتصال به دیتابیس:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>آدرس: localhost</li>
            <li>پورت: 5432</li>
            <li>نام دیتابیس: barcode_scanner</li>
            <li>یوزر: postgres</li>
            <li>پسورد: (پسورد PostgreSQL خود را وارد کنید)</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            تنظیمات پیشنهادی جداول:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>نام جدول بارکد: barcodes</li>
            <li>نام ستون بارکد: barcode</li>
            <li>نام ستون کد محصول (در جدول بارکد): product_code</li>
            <li>نام جدول محصولات: products</li>
            <li>نام ستون کد محصول: product_code</li>
            <li>نام ستون نام محصول: product_name</li>
            <li>نام ستون تصویر محصول: product_image</li>
            <li>نام ستون قیمت 1: price1</li>
            <li>نام ستون قیمت 2: price2</li>
            <li>نام ستون قیمت 3: price3</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
