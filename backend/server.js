// server.js
const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // For Azure
    trustServerCertificate: true, // Change to false for production
  },
};

// Connect to database and execute query
async function connectAndQuery(query, params = []) {
  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Add parameters to the request if provided
    params.forEach((param) => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error("SQL error", err);
    throw err;
  } finally {
    sql.close();
  }
}

// API endpoint for settings
app.get("/api/settings", async (req, res) => {
  try {
    // This endpoint could return database connection info or other settings
    // In a real app, you might want to limit what data you expose
    res.json({
      status: "success",
      message: "Connected to database",
      dbName: process.env.DB_NAME,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// API endpoint to get product by barcode
app.get("/api/product/:barcode", async (req, res) => {
  const { barcode } = req.params;

  try {
    // First, try to find product code from barcode table
    const barcodeTableName = process.env.BARCODE_TABLE;
    const barcodeColumnName = process.env.BARCODE_COLUMN;
    const productCodeColumnName = process.env.PRODUCT_CODE_COLUMN;

    let productCode = null;
    let productData = null;

    // Search in barcode table
    const barcodeQuery = `
      SELECT ${productCodeColumnName} 
      FROM ${barcodeTableName} 
      WHERE ${barcodeColumnName} = @barcode
    `;

    const barcodeResult = await connectAndQuery(barcodeQuery, [
      { name: "barcode", type: sql.VarChar, value: barcode },
    ]);

    if (barcodeResult && barcodeResult.length > 0) {
      // Found product code in barcode table
      productCode = barcodeResult[0][productCodeColumnName];
    } else {
      // If not found in barcode table, try direct lookup
      // Remove possible suffix from barcode to get product code
      productCode = barcode;
    }

    // Now retrieve product data using product code
    const productsTableName = process.env.PRODUCTS_TABLE;
    const productCodeColumn = process.env.PRODUCTS_CODE_COLUMN;
    const productNameColumn = process.env.PRODUCTS_NAME_COLUMN;
    const productImageColumn = process.env.PRODUCTS_IMAGE_COLUMN;
    const productPrice1Column = process.env.PRODUCTS_PRICE1_COLUMN;
    const productPrice2Column = process.env.PRODUCTS_PRICE2_COLUMN;
    const productPrice3Column = process.env.PRODUCTS_PRICE3_COLUMN;

    const productQuery = `
      SELECT 
        ${productCodeColumn} as productCode, 
        ${productNameColumn} as productName, 
        ${productImageColumn} as productImage,
        ${productPrice1Column} as price1,
        ${productPrice2Column} as price2,
        ${productPrice3Column} as price3
      FROM ${productsTableName} 
      WHERE ${productCodeColumn} = @productCode
    `;

    const productResult = await connectAndQuery(productQuery, [
      { name: "productCode", type: sql.VarChar, value: productCode },
    ]);

    if (productResult && productResult.length > 0) {
      productData = productResult[0];
      res.json({ status: "success", data: productData });
    } else {
      res.status(404).json({ status: "error", message: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Save settings API
app.post("/api/settings", async (req, res) => {
  try {
    console.log("Received settings data:", req.body);

    const {
      dbServer,
      dbPort,
      dbName,
      dbUser,
      dbPassword,
      barcodeTable,
      barcodeColumn,
      productCodeColumn,
      productsTable,
      productsCodeColumn,
      productsNameColumn,
      productsImageColumn,
      productsPrice1Column,
      productsPrice2Column,
      productsPrice3Column,
    } = req.body;

    // Validate required fields
    if (!dbServer || !dbName || !dbUser || !dbPassword || !productsTable) {
      return res.status(400).json({
        status: "error",
        message: "Missing required database connection information",
      });
    }

    // For a real app, you might want to validate these values more thoroughly
    // and save them to environment variables or a configuration database

    // For this example, we just return success
    return res.json({
      status: "success",
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
});

// Test database connection
app.post("/api/test-connection", async (req, res) => {
  const { dbServer, dbPort, dbName, dbUser, dbPassword } = req.body;

  const testConfig = {
    user: dbUser,
    password: dbPassword,
    server: dbServer,
    database: dbName,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };

  try {
    const pool = new sql.ConnectionPool(testConfig);
    await pool.connect();
    await pool.close();
    res.json({ status: "success", message: "Connection successful" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
