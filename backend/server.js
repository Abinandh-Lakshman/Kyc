// server.js (The Final Correct Version)

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Helper to find PAN (This part is correct)
const findPanInDetails = (details) => {
  if (!details || typeof details !== "object") return null;
  for (const sectionKey in details) {
    const section = details[sectionKey];
    if (section && typeof section === "object") {
      for (const fieldKey in section) {
        if (
          fieldKey.toLowerCase() === "pan" ||
          fieldKey.toLowerCase() === "pan number"
        ) {
          return section[fieldKey];
        }
      }
    }
  }
  return null;
};

// ✨ The bulletproof SQL query builder. Notice `trim()`!
const createPanCheckQuery = (isUpdate = false) => {
  let sql = `
    SELECT id FROM kyc_profiles p
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each(p.details) AS section,
           jsonb_each_text(section.value) AS field
      WHERE
        (lower(field.key) = 'pan' OR lower(field.key) = 'pan number')
        AND upper(trim(field.value)) = $1
    )
  `;
  if (isUpdate) {
    sql += " AND p.id != $2";
  }
  return sql;
};

// ---- 1. Create new profile (Maker) ----
app.post("/api/profiles", async (req, res) => {
  try {
    const { details } = req.body;
    const pan = findPanInDetails(details);

    if (pan) {
      const panCheckSql = createPanCheckQuery(false);
      // ✨ Clean the incoming PAN value from the user
      const cleanPan = pan.toUpperCase().trim();
      const { rows } = await pool.query(panCheckSql, [cleanPan]);

      if (rows.length > 0) {
        return res.status(409).json({
          error: "Conflict: A profile with this PAN number already exists.",
        });
      }
    }

    const result = await pool.query(
      "INSERT INTO kyc_profiles (details) VALUES ($1) RETURNING *",
      [details]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /profiles error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- 2. Update existing profile (Maker edits) ----
app.put("/api/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { details } = req.body;

    if (!details) {
      return res.status(400).json({ error: "Missing details in request body" });
    }

    const pan = findPanInDetails(details);
    if (pan) {
      const panCheckSql = createPanCheckQuery(true);
      // ✨ Clean the incoming PAN value from the user
      const cleanPan = pan.toUpperCase().trim();
      const { rows } = await pool.query(panCheckSql, [cleanPan, id]);

      if (rows.length > 0) {
        return res.status(409).json({
          error:
            "Conflict: This PAN number is already assigned to another profile.",
        });
      }
    }

    const result = await pool.query(
      "UPDATE kyc_profiles SET details=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [details, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /profiles/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- 5. Fetch by PAN (Reports search & Maker uniqueness check) ----
app.get("/api/profiles/by-pan/:pan", async (req, res) => {
  try {
    // ✨ Clean the incoming PAN value from the user
    const pan = (req.params.pan || "").toUpperCase().trim();

    // ✨ The query here ALSO needs trim() for consistency
    const sql = `
      SELECT p.id, p.details, p.verified, p.created_at, p.updated_at
      FROM kyc_profiles p
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_each(p.details) AS section,
             jsonb_each_text(section.value) AS field
        WHERE
          (lower(field.key) = 'pan' OR lower(field.key) = 'pan number')
          AND upper(trim(field.value)) = $1
      )
    `;

    const { rows } = await pool.query(sql, [pan]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching profile by PAN:", err);
    res.status(500).json({ message: "Server error while fetching by PAN" });
  }
});

// (The rest of your server file is correct, you can copy it from your own file)
// ---- 3. Update verification (Checker) ----
app.put("/api/profiles/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    if (!verified) {
      return res.status(400).json({ error: "Missing verified object" });
    }
    const result = await pool.query(
      "UPDATE kyc_profiles SET verified=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [verified, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /profiles/:id/verify error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- 4. Fetch by ID ----
app.get("/api/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM kyc_profiles WHERE id=$1", [
      id,
    ]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("GET /profiles/:id error:", err);
    res.status(500).json({ error: "Error fetching profile by ID" });
  }
});

// ---- Fields API ----
app.get("/api/fields", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM fields ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /fields error", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/fields", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      "INSERT INTO fields (name) VALUES ($1) RETURNING *",
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("POST /fields error", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/fields/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      "UPDATE fields SET name=$1 WHERE id=$2 RETURNING *",
      [name, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /fields error", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/fields/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM fields WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /fields error", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
