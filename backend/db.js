const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Kyc_portal",
  password: "12345",
  port: 5432,
});

module.exports = pool;
