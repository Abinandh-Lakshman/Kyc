import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Maker.css";

const Maker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- Initial setup from navigation state ---
  const previewData = location.state?.previewData || {};
  const formValuesFromReports = location.state?.formValues || {};
  const activeFromReports = location.state?.activeSection;
  const verifiedFromReports = location.state?.verifiedFields || {};
  const profileIdFromReports = location.state?.profileId;

  // --- Determine sections to display ---
  let sections = [];
  if (previewData && Object.keys(previewData).length > 0) {
    sections = Object.keys(previewData).filter(
      (sec) => previewData[sec] && previewData[sec].length > 0
    );
  }
  if (
    sections.length === 0 &&
    formValuesFromReports &&
    Object.keys(formValuesFromReports).length > 0
  ) {
    sections = Object.keys(formValuesFromReports);
  }

  // --- Early return if no sections are available ---
  if (sections.length === 0) {
    return (
      <div className="checker-container">
        <header className="checker-header">
          <h2>Maker Dashboard</h2>
        </header>
        <div style={{ padding: "20px" }}>
          <h3>No sections were assigned from Admin.</h3>
        </div>
      </div>
    );
  }

  // --- State Initialization ---
  const initialValues = {};
  sections.forEach((sec) => {
    initialValues[sec] = formValuesFromReports[sec] || {};
  });

  const [activeSection, setActiveSection] = useState(
    activeFromReports || sections[0]
  );
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState(
    Object.fromEntries(sections.map((s) => [s, {}]))
  );
  const [verifiedFields] = useState(verifiedFromReports);

  // --- Validation Logic ---
  const validateField = (field, value) => {
    let error = "";
    const lower = field.toLowerCase();

    if (lower === "aadhar" || lower === "aadhaar") {
      if (!/^\d{12}$/.test(value)) error = "Aadhar must be 12 digits.";
    } else if (lower === "pan" || lower === "pan number") {
      if (!/^[A-Z0-9]{10}$/.test(value))
        error = "PAN must be 10 characters (uppercase letters/digits).";
    } else if (lower.includes("email")) {
      if (!/.+@.+\..+/.test(value)) error = "Invalid email.";
    } else if (lower.includes("phone") || lower.includes("mobile")) {
      if (!/^\d{10}$/.test(value)) error = "Phone must be 10 digits.";
    } else {
      if (!value.trim()) error = "This field is required.";
    }
    return error;
  };

  // --- Event Handlers ---
  // In Maker.js

  const handleChange = (section, field, value) => {
    const lower = field.toLowerCase();

    if (lower === "pan" || lower === "pan number") {
      // ✨ BULLETPROOF CHANGE: Clean the value immediately
      value = value.toUpperCase().trim();
    }

    setFormValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));

    const err = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: err },
    }));
  };
  // Validates ONLY the active section. Used by "Save" and "Next" buttons.
  const handleSave = (e) => {
    if (e) e.preventDefault();
    const newErrors = {};
    let hasError = false;

    const fields =
      previewData[activeSection] ||
      Object.keys(formValues[activeSection] || {});
    fields.forEach((field) => {
      const value = formValues[activeSection]?.[field] || "";
      const err = validateField(field, value);
      if (err) hasError = true;
      newErrors[field] = err;
    });

    setErrors((prev) => ({ ...prev, [activeSection]: newErrors }));

    if (hasError) {
      alert("⚠ Please fix validation errors.");
      return false; // Indicate failure
    }

    alert(`✅ Section ${activeSection} saved`); // This doesn't hit the server, just confirms local state.
    return true; // Indicate success
  };

  // The final submission logic with server-side validation.
  const handleSubmitAll = async () => {
    // 1. Run full client-side validation on ALL sections first.
    let hasClientError = false;
    const allErrors = {};
    sections.forEach((sec) => {
      allErrors[sec] = {};
      (previewData[sec] || Object.keys(formValues[sec] || {})).forEach(
        (field) => {
          const value = formValues[sec]?.[field] || "";
          const err = validateField(field, value);
          if (err) hasClientError = true;
          allErrors[sec][field] = err;
        }
      );
    });

    setErrors(allErrors);
    if (hasClientError) {
      alert("⚠ Please correct all validation errors before submitting.");
      return;
    }

    // 2. Attempt to save the data to the server.
    try {
      let response;
      const body = JSON.stringify({ details: formValues });

      if (profileIdFromReports) {
        // This is an UPDATE operation
        response = await fetch(
          `http://localhost:5000/api/profiles/${profileIdFromReports}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: body,
          }
        );
      } else {
        // This is a CREATE operation
        response = await fetch("http://localhost:5000/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
        });
      }

      // 3. Handle the server's response.
      if (!response.ok) {
        // The server responded with an error (e.g., 409 Conflict for duplicate PAN)
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      // 4. If everything is successful, navigate to the checker page.
      const savedProfile = await response.json();
      navigate("/checker", {
        state: {
          formValues,
          previewData,
          verifiedFields,
          profileId: savedProfile.id,
        },
      });
    } catch (err) {
      // This single catch block handles network errors AND server validation errors gracefully.
      console.error("❌ Error submitting profile: ", err);
      alert(`❌ Submission Failed: ${err.message}`);
    }
  };

  const handleBack = () => {
    const idx = sections.indexOf(activeSection);
    if (idx > 0) setActiveSection(sections[idx - 1]);
  };

  const handleNext = () => {
    // Uses handleSave to validate the current section before moving on.
    if (!handleSave()) return;
    const idx = sections.indexOf(activeSection);
    if (idx < sections.length - 1) setActiveSection(sections[idx + 1]);
  };

  // Helper for setting input attributes based on field name
  const getInputProps = (field) => {
    const lower = field.toLowerCase();
    if (lower === "aadhar" || lower === "aadhaar")
      return { maxLength: 12, inputMode: "numeric", pattern: "[0-9]*" };
    if (lower === "pan" || lower === "pan number")
      return { maxLength: 10, style: { textTransform: "uppercase" } };
    if (lower.includes("phone") || lower.includes("mobile"))
      return { maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" };
    if (lower.includes("email")) return { type: "email" };
    return {};
  };

  return (
    <div className="checker-container">
      <header className="checker-header">
        <h2>Maker Dashboard</h2>
      </header>

      <div className="checker-layout">
        <aside className="section-sidebar">
          {sections.map((sec) => (
            <button
              key={sec}
              className={`nav-btn ${activeSection === sec ? "active" : ""}`}
              onClick={() => setActiveSection(sec)}
            >
              Section {sec}
            </button>
          ))}
        </aside>

        <main className="checker-content">
          <h3>Section {activeSection}</h3>
          <form className="checker-form" onSubmit={(e) => e.preventDefault()}>
            {(
              previewData[activeSection] ||
              Object.keys(formValues[activeSection] || {})
            ).map((field) => (
              <div key={field} className="form-group">
                <label>{field}</label>
                <input
                  {...getInputProps(field)}
                  value={formValues[activeSection]?.[field] || ""}
                  onChange={(e) =>
                    handleChange(activeSection, field, e.target.value)
                  }
                  placeholder={`Enter ${field}`}
                />
                {errors[activeSection]?.[field] && (
                  <span className="error-msg">
                    {errors[activeSection][field]}
                  </span>
                )}
              </div>
            ))}
          </form>

          {/* This is the original button layout from your code */}
          <div className="nav-buttons">
            {sections.indexOf(activeSection) > 0 && (
              <button className="back-btn" onClick={handleBack}>
                ⟵ Back
              </button>
            )}
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
            {sections.indexOf(activeSection) < sections.length - 1 ? (
              <button className="next-btn" onClick={handleNext}>
                Next ⟶
              </button>
            ) : (
              <button className="finish-btn" onClick={handleSubmitAll}>
                Submit All
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Maker;
