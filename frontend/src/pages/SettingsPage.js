// src/pages/SettingsPage.js
import React, { useState, useContext, useRef } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [formData, setFormData] = useState({...settings});
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const formRef = useRef(null);
  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
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
        dbPassword: formData.dbPassword
      };
      
      const result = await apiService.testConnection(connectionData);
      setTestResult({
        success: true,
        message: 'اتصال به دیتابیس با موفقیت انجام شد.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `خطا در اتصال به دیتابیس: ${error.message || 'خطای نامشخص'}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Save to context (which also saves to localStorage)
      updateSettings(formData);
      
      // Also save to backend if needed
      await apiService.saveSettings(formData);
      
      alert('تنظیمات با موفقیت ذخیره شد.');
      navigate('/');
    } catch (error) {
      alert(`خطا در ذخیره تنظیمات: ${error.message || 'خطای نامشخص'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4" style={{direction: 'rtl'}}>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">تنظیمات اتصال به دیتابیس</h2>
        
        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Database Connection Settings */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">اطلاعات اولیه دیتابیس</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dbServer">
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dbPort">
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dbName">
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dbUser">
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dbPassword">
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
                {isLoading ? 'در حال تست...' : 'تست اتصال'}
              </button>
              
              {testResult && (
                <div className={`mt-2 p-2 rounded ${testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
          
          {/* Barcode Table Settings */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">اطلاعات جدول بارکد</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcodeTable">
                  نام جدول
                </label>
                <input
                  type="text"
                  id="barcodeTable"
                  name="barcodeTable"
                  value={formData.barcodeTable}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcodeColumn">
                  نام ستون بارکد
                </label>
                <input
                  type="text"
                  id="barcodeColumn"
                  name="barcodeColumn"
                  value={formData.barcodeColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productCodeColumn">
                  نام ستون کدمحصول
                </label>
                <input
                  type="text"
                  id="productCodeColumn"
                  name="productCodeColumn"
                  value={formData.productCodeColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
          </div>
          
          {/* Products Table Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">اطلاعات جدول محصولات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productsTable">
                  نام جدول
                </label>
                <input
                  type="text"
                  id="productsTable"
                  name="productsTable"
                  value={formData.productsTable}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productsCodeColumn">
                  نام ستون کدمحصول
                </label>
                <input
                  type="text"
                  id="productsCodeColumn"
                  name="productsCodeColumn"
                  value={formData.productsCodeColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productsNameColumn">
                  نام ستون اسم محصول
                </label>
                <input
                  type="text"
                  id="productsNameColumn"
                  name="productsNameColumn"
                  value={formData.productsNameColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productsImageColumn">
                  نام ستون عکس محصول
                </label>
                <input
                  type="text"
                  id="productsImageColumn"
                  name="productsImageColumn"
                  value={formData.productsImageColumn}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productsPrice1Column">
                  نام ستون تیپ قیمت 1
                </label>
                <input
                  type="text"
                  id="productsPrice1Column"
                  name="productsPrice1Column"
                  value={formData.productsPrice1Column}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productsPrice2Column">
                  نام ستون تیپ قیمت 2
                </label>
                <input
                  type="text"
                  id="productsPrice2Column"
                  name="productsPrice2Column"
                  value={formData.productsPrice2Column}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productsPrice3Column">
                  نام ستون تیپ قیمت 3
                </label>
                <input
                  type="text"
                  id="productsPrice3Column"
                  name="productsPrice3Column"
                  value={formData.productsPrice3Column}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isLoading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
