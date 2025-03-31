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
  const [saveError, setSaveError] = useState(null);
  const formRef = useRef(null);
  const navigate = useNavigate();

  // Reset error message when form changes
  useEffect(() => {
    setSaveError(null);
  }, [formData]);

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

    try {
      const connectionData = {
        dbServer: formData.dbServer,
        dbPort: formData.dbPort,
        dbName: formData.dbName,
        dbUser: formData.dbUser,
        dbPassword: formData.dbPassword,
      };

      console.log("Testing connection with:", connectionData);
      const result = await apiService.testConnection(connectionData);
      setTestResult({
        success: true,
        message: "اتصال به دیتابیس با موفقیت انجام شد.",
      });
    } catch (error) {
      console.error("Connection test failed:", error);
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
    setSaveError(null);

    try {
      console.log("Saving settings to context:", formData);
      // First update the context (which also saves to localStorage)
      updateSettings(formData);

      try {
        // Then try to save to backend
        console.log("Attempting to save settings to backend");
        await apiService.saveSettings(formData);
        console.log("Backend save successful");
      } catch (backendError) {
        // If backend save fails, still proceed with the local storage
        console.warn(
          "Backend save failed, but continuing with localStorage only:",
          backendError,
        );
      }

      // Show success message
      alert("تنظیمات با موفقیت ذخیره شد.");

      // Use setTimeout to ensure the alert is shown before navigation
      setTimeout(() => {
        console.log("Navigating to home page");
        navigate("/");
      }, 100);
    } catch (error) {
      console.error("Settings save error:", error);
      setSaveError(`خطا در ذخیره تنظیمات: ${error.message || "خطای نامشخص"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip to beginning of form content
  return (
    <div className="container mx-auto p-4" style={{ direction: "rtl" }}>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          تنظیمات اتصال به دیتابیس
        </h2>

        {saveError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {saveError}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Database Connection Settings */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              اطلاعات اولیه دیتابیس
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dbServer"
                >
                  آیپی
                </label>
                <input
                  type="text"
                  id="dbServer"
                  name="dbServer"
                  value={formData.dbServer}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="192.168.1.1"
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
                  placeholder="1433"
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

          {/* Rest of the form remains the same - keeping it for brevity */}
          {/* ... */}

          <div className="mt-6 flex justify-end">
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
    </div>
  );
};

export default SettingsPage;
