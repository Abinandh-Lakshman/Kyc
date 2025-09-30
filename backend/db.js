// This is the complete and correct content for your backend/db.js file

const { Pool } = require("pg");

// This code checks if we are in the "production" environment (on Render)
const isProduction = process.env.NODE_ENV === "production";

// Use the DATABASE_URL from Render's environment variables in production,
// otherwise, fall back to your local database configuration.
const connectionString = isProduction
  ? process.env.DATABASE_URL
  : "postgresql://your_local_user:your_local_password@localhost:5432/kyc";

const pool = new Pool({
  connectionString: connectionString,
  // This is required for connecting to Render's PostgreSQL database
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;

