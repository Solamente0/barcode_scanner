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
  const [activeSection, setActiveSection] = useState("database"); // Track which section is expanded
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

  // Toggle section visibility
  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Card that can collapse/expand
  const SettingsCard = ({ title, id, icon, children }) => {
    const isActive = activeSection === id;

    return (
      <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden transition-all duration-300">
        <div
          className={`px-4 py-3 flex justify-between items-center cursor-pointer ${isActive ? "bg-blue-50 border-b border-blue-100" : ""}`}
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center">
            {icon}
            <h3 className="text-lg font-semibold text-gray-700 mr-2">
              {title}
            </h3>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isActive ? "transform -rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${isActive ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="p-4">{children}</div>
        </div>
      </div>
    );
  };

  // Text input field component
  const TextField = ({
    label,
    id,
    name,
    value,
    placeholder,
    required = false,
  }) => (
    <div className="mb-4">
      <label
        className="block text-gray-700 text-sm font-bold mb-2"
        htmlFor={id}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={name.includes("Password") ? "password" : "text"}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  return (
    <div className="container mx-auto p-4" style={{ direction: "rtl" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 ml-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold">تنظیمات اتصال به دیتابیس</h2>
          </div>
          <p className="mt-2 text-white text-opacity-90">
            در این صفحه می‌توانید تنظیمات اتصال به دیتابیس و جداول را مشخص کنید.
          </p>
        </div>

        {/* Notification Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg text-green-800 p-4 mb-6 flex items-start shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-500 ml-2 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="text-sm text-green-700 mt-1">
                در حال انتقال به صفحه اصلی...
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg text-red-800 p-4 mb-6 flex items-start shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500 ml-2 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Database Connection Settings */}
          <SettingsCard
            title="اطلاعات اولیه دیتابیس PostgreSQL"
            id="database"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="آیپی / هاست"
                id="dbServer"
                name="dbServer"
                value={formData.dbServer}
                placeholder="localhost"
                required={true}
              />

              <TextField
                label="پورت"
                id="dbPort"
                name="dbPort"
                value={formData.dbPort}
                placeholder="5432"
              />

              <TextField
                label="نام دیتابیس"
                id="dbName"
                name="dbName"
                value={formData.dbName}
                placeholder="barcode_scanner"
                required={true}
              />

              <TextField
                label="یوزر"
                id="dbUser"
                name="dbUser"
                value={formData.dbUser}
                placeholder="postgres"
                required={true}
              />

              <TextField
                label="پسورد"
                id="dbPassword"
                name="dbPassword"
                value={formData.dbPassword}
                placeholder="••••••••"
                required={true}
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-md"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    در حال تست...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    تست اتصال
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-lg ${
                    testResult.success
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex">
                    {testResult.success ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-500 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {testResult.message}
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* Barcode Table Settings */}
          <SettingsCard
            title="اطلاعات جدول بارکد"
            id="barcode"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="نام جدول"
                id="barcodeTable"
                name="barcodeTable"
                value={formData.barcodeTable}
                placeholder="barcodes"
              />

              <TextField
                label="نام ستون بارکد"
                id="barcodeColumn"
                name="barcodeColumn"
                value={formData.barcodeColumn}
                placeholder="barcode"
              />

              <TextField
                label="نام ستون کدمحصول"
                id="productCodeColumn"
                name="productCodeColumn"
                value={formData.productCodeColumn}
                placeholder="product_code"
              />
            </div>
          </SettingsCard>

          {/* Products Table Settings */}
          <SettingsCard
            title="اطلاعات جدول محصولات"
            id="products"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="نام جدول"
                id="productsTable"
                name="productsTable"
                value={formData.productsTable}
                placeholder="products"
                required={true}
              />

              <TextField
                label="نام ستون کدمحصول"
                id="productsCodeColumn"
                name="productsCodeColumn"
                value={formData.productsCodeColumn}
                placeholder="product_code"
                required={true}
              />

              <TextField
                label="نام ستون اسم محصول"
                id="productsNameColumn"
                name="productsNameColumn"
                value={formData.productsNameColumn}
                placeholder="product_name"
                required={true}
              />

              <TextField
                label="نام ستون عکس محصول"
                id="productsImageColumn"
                name="productsImageColumn"
                value={formData.productsImageColumn}
                placeholder="product_image"
              />

              <TextField
                label="نام ستون تیپ قیمت 1"
                id="productsPrice1Column"
                name="productsPrice1Column"
                value={formData.productsPrice1Column}
                placeholder="price1"
                required={true}
              />

              <TextField
                label="نام ستون تیپ قیمت 2"
                id="productsPrice2Column"
                name="productsPrice2Column"
                value={formData.productsPrice2Column}
                placeholder="price2"
              />

              <TextField
                label="نام ستون تیپ قیمت 3"
                id="productsPrice3Column"
                name="productsPrice3Column"
                value={formData.productsPrice3Column}
                placeholder="price3"
              />
            </div>
          </SettingsCard>

          {/* Guide & Default Settings */}
          <SettingsCard
            title="راهنمای تنظیمات"
            id="guide"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          >
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                اطلاعات نمونه برای اتصال به دیتابیس:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 pr-4">
                <li className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">آدرس:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    localhost
                  </code>
                </li>
                <li className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">پورت:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    5432
                  </code>
                </li>
                <li className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام دیتابیس:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    barcode_scanner
                  </code>
                </li>
                <li className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">یوزر:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    postgres
                  </code>
                </li>
                <li>
                  <span className="font-medium text-gray-900">پسورد:</span>{" "}
                  (پسورد PostgreSQL خود را وارد کنید)
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                تنظیمات پیشنهادی جداول:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-4">
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام جدول بارکد:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    barcodes
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام ستون بارکد:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    barcode
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام ستون کد محصول:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    product_code
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام جدول محصولات:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    products
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام ستون نام محصول:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    product_name
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام ستون تصویر محصول:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    product_image
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام ستون قیمت 1:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    price1
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام ستون قیمت 2:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    price2
                  </code>
                </div>
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900 ml-2">
                    نام ستون قیمت 3:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    price3
                  </code>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Form Actions */}
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              بازگشت
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-md"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  ذخیره تنظیمات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
