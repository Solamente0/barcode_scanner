// server.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Log startup information
console.log("===== BARCODE SCANNER API SERVER =====");
console.log(`Starting server with NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Loading configuration from .env file...`);

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

console.log("CORS configuration:", {
  origins: corsOptions.origin,
  methods: corsOptions.methods,
  credentials: corsOptions.credentials,
});

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Request Headers:`, req.headers);

  if (req.body && Object.keys(req.body).length > 0) {
    // Mask sensitive data in logs
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.dbPassword) sanitizedBody.dbPassword = "******";
    console.log(`Request Body:`, sanitizedBody);
  }

  // Add response logger
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] Response ${res.statusCode} completed in ${duration}ms`,
    );

    // Only log response body for non-binary data and if not too large
    if (typeof body === "string" && body.length < 1000) {
      try {
        const parsedBody = JSON.parse(body);
        console.log(`Response Body:`, parsedBody);
      } catch (e) {
        // Not JSON or can't be parsed, skip logging body
      }
    }

    return originalSend.call(this, body);
  };

  next();
});

// Database configuration
const getDbConfig = (customConfig = null) => {
  const config = customConfig || {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_SERVER,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };

  // Log database config with password masked
  const loggableConfig = { ...config, password: "******" };
  console.log("Database Configuration:", loggableConfig);

  return config;
};

// Execute database query
async function connectAndQuery(query, params = [], customConfig = null) {
  console.log(`Executing query: ${query}`);
  console.log(`Query parameters:`, params);

  const pool = new Pool(getDbConfig(customConfig));
  console.log(`Database pool created`);

  try {
    console.log(`Executing query...`);
    const result = await pool.query(query, params);
    console.log(`Query successful, ${result.rows.length} rows returned`);
    return result.rows;
  } catch (err) {
    console.error("PostgreSQL error:", err);
    throw err;
  } finally {
    console.log(`Closing database pool`);
    await pool.end();
  }
}

// Pre-flight OPTIONS request handler
app.options("*", cors(corsOptions));
console.log("OPTIONS pre-flight handler configured");

// API endpoint for settings
app.get("/api/settings", async (req, res) => {
  console.log("GET /api/settings: Retrieving current settings");

  try {
    console.log(
      `Current database settings: ${process.env.DB_NAME} on ${process.env.DB_SERVER}`,
    );

    res.json({
      status: "success",
      message: "Connected to database",
      dbName: process.env.DB_NAME,
    });

    console.log("Settings retrieved successfully");
  } catch (error) {
    console.error("Error retrieving settings:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// API endpoint to get product by barcode
app.get("/api/product/:barcode", async (req, res) => {
  const { barcode } = req.params;
  console.log(`GET /api/product/${barcode}: Looking up product by barcode`);

  try {
    // First, try to find product code from barcode table
    const barcodeTableName = process.env.BARCODE_TABLE;
    const barcodeColumnName = process.env.BARCODE_COLUMN;
    const productCodeColumnName = process.env.PRODUCT_CODE_COLUMN;

    console.log(`Barcode lookup settings:`, {
      barcodeTable: barcodeTableName,
      barcodeColumn: barcodeColumnName,
      productCodeColumn: productCodeColumnName,
    });

    let productCode = null;
    let productData = null;

    // Search in barcode table (if the table and columns are defined)
    if (barcodeTableName && barcodeColumnName && productCodeColumnName) {
      console.log(`Searching for barcode in ${barcodeTableName} table`);

      const barcodeQuery = `
        SELECT ${productCodeColumnName} 
        FROM ${barcodeTableName} 
        WHERE ${barcodeColumnName} = $1
      `;

      const barcodeResult = await connectAndQuery(barcodeQuery, [barcode]);

      if (barcodeResult && barcodeResult.length > 0) {
        // Found product code in barcode table
        productCode = barcodeResult[0][productCodeColumnName.toLowerCase()];
        console.log(`Found product code in barcode table: ${productCode}`);
      } else {
        console.log(`Barcode not found in ${barcodeTableName} table`);
      }
    } else {
      console.log(`Barcode table not configured, skipping barcode lookup`);
    }

    // If not found in barcode table or not set up, use barcode as product code
    if (!productCode) {
      productCode = barcode;
      console.log(`Using barcode as product code: ${productCode}`);
    }

    // Now retrieve product data using product code
    const productsTableName = process.env.PRODUCTS_TABLE;
    const productCodeColumn = process.env.PRODUCTS_CODE_COLUMN;
    const productNameColumn = process.env.PRODUCTS_NAME_COLUMN;
    const productImageColumn = process.env.PRODUCTS_IMAGE_COLUMN;
    const productPrice1Column = process.env.PRODUCTS_PRICE1_COLUMN;
    const productPrice2Column = process.env.PRODUCTS_PRICE2_COLUMN;
    const productPrice3Column = process.env.PRODUCTS_PRICE3_COLUMN;

    console.log(`Product lookup settings:`, {
      productsTable: productsTableName,
      productCodeColumn: productCodeColumn,
      productNameColumn: productNameColumn,
      priceColumns: [
        productPrice1Column,
        productPrice2Column,
        productPrice3Column,
      ],
    });

    const productQuery = `
      SELECT 
        ${productCodeColumn} as "productCode", 
        ${productNameColumn} as "productName", 
        ${productImageColumn} as "productImage",
        ${productPrice1Column} as "price1",
        ${productPrice2Column} as "price2",
        ${productPrice3Column} as "price3"
      FROM ${productsTableName} 
      WHERE ${productCodeColumn} = $1
    `;

    console.log(
      `Searching for product with code ${productCode} in ${productsTableName} table`,
    );
    const productResult = await connectAndQuery(productQuery, [productCode]);

    if (productResult && productResult.length > 0) {
      productData = productResult[0];
      console.log(`Product found:`, productData);
      res.json({ status: "success", data: productData });
    } else {
      console.log(`Product not found with code: ${productCode}`);
      res.status(404).json({ status: "error", message: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Save settings API
app.post("/api/settings", async (req, res) => {
  console.log("POST /api/settings: Saving settings");

  try {
    const settings = req.body;
    console.log("Received settings (password masked):", {
      ...settings,
      dbPassword: settings.dbPassword ? "******" : undefined,
    });

    // Update environment variables
    process.env.DB_SERVER = settings.dbServer;
    process.env.DB_PORT = settings.dbPort || "5432";
    process.env.DB_NAME = settings.dbName;
    process.env.DB_USER = settings.dbUser;
    process.env.DB_PASSWORD = settings.dbPassword;
    process.env.BARCODE_TABLE = settings.barcodeTable;
    process.env.BARCODE_COLUMN = settings.barcodeColumn;
    process.env.PRODUCT_CODE_COLUMN = settings.productCodeColumn;
    process.env.PRODUCTS_TABLE = settings.productsTable;
    process.env.PRODUCTS_CODE_COLUMN = settings.productsCodeColumn;
    process.env.PRODUCTS_NAME_COLUMN = settings.productsNameColumn;
    process.env.PRODUCTS_IMAGE_COLUMN = settings.productsImageColumn;
    process.env.PRODUCTS_PRICE1_COLUMN = settings.productsPrice1Column;
    process.env.PRODUCTS_PRICE2_COLUMN = settings.productsPrice2Column;
    process.env.PRODUCTS_PRICE3_COLUMN = settings.productsPrice3Column;

    console.log("Settings saved to environment variables");

    res.json({ status: "success", message: "Settings saved successfully" });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Test database connection
app.post("/api/test-connection", async (req, res) => {
  console.log("POST /api/test-connection: Testing database connection");

  const { dbServer, dbPort, dbName, dbUser, dbPassword } = req.body;
  console.log("Connection test parameters (password masked):", {
    dbServer,
    dbPort,
    dbName,
    dbUser,
    dbPassword: dbPassword ? "******" : undefined,
  });

  const testConfig = {
    user: dbUser,
    password: dbPassword,
    host: dbServer,
    port: dbPort || 5432,
    database: dbName,
    ssl: false,
  };

  try {
    // Test connection by executing a simple query
    console.log("Testing connection with simple query: SELECT NOW()");
    await connectAndQuery("SELECT NOW()", [], testConfig);

    console.log("Database connection test successful!");
    res.json({ status: "success", message: "Connection successful" });
  } catch (error) {
    console.error("Connection test failed:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`CORS enabled for: ${corsOptions.origin.join(", ")}`);
  console.log(`Database server: ${process.env.DB_SERVER || "Not configured"}`);
  console.log(`Database name: ${process.env.DB_NAME || "Not configured"}`);
  console.log("=== SERVER READY ===");
});
