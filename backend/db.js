// This is the complete and correct content for your backend/db.js file

const { Pool } = require("pg");

// This code checks if we are in the "production" environment (on Render)
const isProduction = process.env.NODE_ENV === "production";

// Use the DATABASE_URL from Render for production,
// otherwise, use your local database connection string.
const connectionString = isProduction
  ? process.env.DATABASE_URL
  : "postgresql://Kyc_fields:12345@localhost:5432/kyc_portal";

const pool = new Pool({
  connectionString: connectionString,
  // This is required for connecting to Render's PostgreSQL database
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
