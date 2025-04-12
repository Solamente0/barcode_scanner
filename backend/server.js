// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Dynamically import database libraries based on configuration
const pg = require("pg");
const sql = require("mssql");

const app = express();
const port = process.env.PORT || 5000;

// Log startup information
console.log("===== BARCODE SCANNER API SERVER =====");
console.log(`Starting server with NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Loading configuration from .env file...`);

// Database type - defaults to postgres if not specified
const DB_TYPE = (process.env.DB_TYPE || "postgres").toLowerCase();
console.log(`Database type: ${DB_TYPE}`);

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

// Fix for database connection - modify the getDbConfig function (around line 80)
const getDbConfig = (customConfig = null) => {
  if (customConfig) {
    console.log("getDbCoasdsadnfig", customConfig);

    // Make sure server is defined and is a string
    if (!customConfig.server && customConfig.dbServer) {
      customConfig.server = customConfig.dbServer;
    }

    // Ensure server is a string
    if (customConfig.server === undefined || customConfig.server === null) {
      throw new Error(
        "The 'config.server' property is required and must be of type string.",
      );
    }

    // Log database config with password masked
    const loggableConfig = { ...customConfig, password: "******" };
    console.log("Custom Database Configuration:", loggableConfig);
    return customConfig;
  }

  let config;

  if (DB_TYPE === "mssql") {
    // SQL Server configuration
    config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER || "localhost", // Set default if undefined
      port: parseInt(process.env.DB_PORT) || 1433, // Default SQL Server port
      database: process.env.DB_NAME,
      options: {
        encrypt: process.env.DB_ENCRYPT === "true", // For Azure
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === "true", // For local dev / self-signed certs
        enableArithAbort: true,
      },
    };
  } else {
    // PostgreSQL configuration (default)
    config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_SERVER || "localhost", // Set default if undefined
      port: parseInt(process.env.DB_PORT) || 5432, // Default PostgreSQL port
      database: process.env.DB_NAME,
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };
  }

  // Log database config with password masked
  const loggableConfig = { ...config, password: "******" };
  console.log(`Database Configuration (${DB_TYPE}):`, loggableConfig);

  return config;
};
// Format SQL query based on DB type
const formatQuery = (query, params = []) => {
  if (DB_TYPE === "mssql") {
    // Replace PostgreSQL parameter placeholders ($1, $2) with MSSQL parameter placeholders (@param1, @param2)
    let mssqlQuery = query;
    for (let i = 0; i < params.length; i++) {
      mssqlQuery = mssqlQuery.replace(
        new RegExp(`\\$${i + 1}`, "g"),
        `@param${i + 1}`,
      );
    }

    // Replace all table and column references with bracketed format for SQL Server
    // This is a simplified approach - for complex queries with joins or subqueries
    // you may need more sophisticated parsing

    // Add brackets to table names and column names (assuming they're already properly escaped)
    return mssqlQuery;
  }

  // For PostgreSQL, return the original query
  return query;
};

// Add brackets to SQL Server identifiers if needed
const bracketIdentifier = (identifier) => {
  return DB_TYPE === "mssql" ? `[${identifier}]` : identifier;
};

// Execute database query
async function connectAndQuery(query, params = [], customConfig = null) {
  console.log(`Executing query: ${query}`);
  console.log(`Query parameters:`, params);

  const config = getDbConfig(customConfig);
  console.log("getDbConfig", config);

  // Validate configuration
  if (
    DB_TYPE === "mssql" &&
    (!config.server || typeof config.server !== "string")
  ) {
    throw new Error(
      "The 'config.server' property is required and must be of type string.",
    );
  }

  if (
    DB_TYPE === "postgres" &&
    (!config.host || typeof config.host !== "string")
  ) {
    throw new Error(
      "The 'config.host' property is required and must be of type string.",
    );
  }

  if (DB_TYPE === "mssql") {
    // SQL Server query execution
    console.log(`Creating SQL Server connection pool`);
    let pool = null;

    try {
      pool = await sql.connect(config);
      console.log(`Database pool created`);

      // Create request with parameters
      const request = pool.request();

      // Add parameters to request
      params.forEach((param, index) => {
        request.input(`param${index + 1}`, param);
      });

      // Format the query for SQL Server
      const formattedQuery = formatQuery(query, params);

      console.log(`Executing SQL Server query...`);
      const result = await request.query(formattedQuery);
      console.log(`Query successful, ${result.recordset.length} rows returned`);
      return result.recordset;
    } catch (err) {
      console.error("SQL Server error:", err);
      throw err;
    } finally {
      if (pool) {
        console.log(`Closing database pool`);
        await pool.close();
      }
    }
  } else {
    // PostgreSQL query execution
    console.log(`Creating PostgreSQL pool`);
    const pool = new pg.Pool(config);

    try {
      console.log(`Executing PostgreSQL query...`);
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
}

// Pre-flight OPTIONS request handler
app.options("*", cors(corsOptions));
console.log("OPTIONS pre-flight handler configured");

app.get("/api/ping", (req, res) => {
  console.log("GET /api/ping: Checking API availability");
  res.json({
    status: "success",
    message: "API is available",
    timestamp: new Date().toISOString(),
  });
});

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
      dbType: process.env.DB_TYPE || "postgres",
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

      // Create appropriate query for the database type
      const bColumnName = bracketIdentifier(barcodeColumnName);
      const pColumnName = bracketIdentifier(productCodeColumnName);
      const bTableName = bracketIdentifier(barcodeTableName);

      const barcodeQuery = `
        SELECT ${pColumnName} 
        FROM ${bTableName} 
        WHERE ${bColumnName} = $1
      `;

      const barcodeResult = await connectAndQuery(barcodeQuery, [barcode]);

      if (barcodeResult && barcodeResult.length > 0) {
        // Handle different property name conventions between the two database types
        const resultKey =
          DB_TYPE === "mssql"
            ? productCodeColumnName
            : productCodeColumnName.toLowerCase();

        productCode = barcodeResult[0][resultKey];
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

    // Format column and table names for the appropriate database
    const pTable = bracketIdentifier(productsTableName);
    const codeCol = bracketIdentifier(productCodeColumn);
    const nameCol = bracketIdentifier(productNameColumn);
    const imageCol = bracketIdentifier(productImageColumn);
    const price1Col = bracketIdentifier(productPrice1Column);
    const price2Col = bracketIdentifier(productPrice2Column);
    const price3Col = bracketIdentifier(productPrice3Column);

    const productQuery = `
      SELECT 
        ${codeCol} as "productCode", 
        ${nameCol} as "productName", 
        ${imageCol} as "productImage",
        ${price1Col} as "price1",
        ${price2Col} as "price2",
        ${price3Col} as "price3"
      FROM ${pTable} 
      WHERE ${codeCol} = $1
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
    process.env.DB_TYPE = settings.dbType || "postgres";
    process.env.DB_SERVER = settings.dbServer;
    process.env.DB_PORT =
      settings.dbPort || (settings.dbType === "mssql" ? "1433" : "5432");
    process.env.DB_NAME = settings.dbName;
    process.env.DB_USER = settings.dbUser;
    process.env.DB_PASSWORD = settings.dbPassword;

    // SQL Server specific settings
    if (settings.dbType === "mssql") {
      process.env.DB_ENCRYPT = settings.dbEncrypt || "false";
      process.env.DB_TRUST_SERVER_CERT = settings.dbTrustServerCert || "false";
    } else {
      // PostgreSQL specific settings
      process.env.DB_SSL = settings.dbSsl || "false";
    }

    // Common table/column settings
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
// Replace the test-connection endpoint in server.js with this fixed version:

// Test database connection
app.post("/api/test-connection", async (req, res) => {
  console.log("POST /api/test-connection: Testing database connection");

  const {
    dbType = "postgres",
    dbServer,
    server, // Add this line to accept both dbServer and server
    dbPort,
    dbName,
    dbUser,
    dbPassword,
    dbSsl,
    dbEncrypt,
    dbTrustServerCert,
  } = req.body;

  // Use either dbServer or server property
  const actualServer = dbServer || server || "";

  // Validate required fields first
  if (!actualServer) {
    return res.status(400).json({
      status: "error",
      message: "Database server address is required",
    });
  }

  // Log parameters - update to include both server properties
  console.log("Connection test parameters (password masked):", {
    dbType,
    dbServer: actualServer,
    dbPort,
    dbName,
    dbUser,
    dbPassword: dbPassword ? "******" : undefined,
    dbSsl,
    dbEncrypt,
    dbTrustServerCert,
  });

  let testConfig;

  if (dbType === "mssql") {
    // SQL Server configuration
    testConfig = {
      user: dbUser,
      password: dbPassword,
      server: String(actualServer), // Use the actual server and ensure it's a string
      port: parseInt(dbPort) || 1433,
      database: dbName,
      options: {
        encrypt: dbEncrypt === true || dbEncrypt === "true",
        trustServerCertificate:
          dbTrustServerCert === true || dbTrustServerCert === "true",
        enableArithAbort: true,
      },
    };
  } else {
    // PostgreSQL configuration
    testConfig = {
      user: dbUser,
      password: dbPassword,
      host: String(actualServer), // Use the actual server and ensure it's a string
      port: parseInt(dbPort) || 5432,
      database: dbName,
      ssl:
        dbSsl === true || dbSsl === "true"
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  try {
    // Test query depends on database type
    const testQuery =
      dbType === "mssql" ? "SELECT GETDATE() as currentTime" : "SELECT NOW()";
    console.log(`Testing connection with query: ${testQuery}`);

    // Temporarily override the DB_TYPE for this connection test
    const originalDbType = process.env.DB_TYPE;
    process.env.DB_TYPE = dbType;

    await connectAndQuery(testQuery, [], testConfig);

    // Restore the original DB_TYPE
    process.env.DB_TYPE = originalDbType;

    console.log("Database connection test successful!");
    res.json({ status: "success", message: "Connection successful" });
  } catch (error) {
    console.error("Connection test failed:", error);
    res.status(500).json({
      status: "error",
      message: `Connection failed: ${error.message || "Unknown error"}`,
    });
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
  console.log(`Database type: ${DB_TYPE}`);
  console.log(`CORS enabled for: ${corsOptions.origin.join(", ")}`);
  console.log(`Database server: ${process.env.DB_SERVER || "Not configured"}`);
  console.log(`Database name: ${process.env.DB_NAME || "Not configured"}`);
  console.log("=== SERVER READY ===");
});
