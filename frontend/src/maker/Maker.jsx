import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Maker.css";
import { API_BASE } from "../admin/Adminfield";

const Maker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const previewData = location.state?.previewData || {};
  const formValuesFromReports = location.state?.formValues || {};
  const activeFromReports = location.state?.activeSection;
  const verifiedFromReports = location.state?.verifiedFields || {};
  const profileIdFromReports = location.state?.profileId;

  let sections = Object.keys(previewData).filter(
    (sec) => previewData[sec]?.length > 0
  );

  if (sections.length === 0 && Object.keys(formValuesFromReports).length > 0) {
    sections = Object.keys(formValuesFromReports);
  }

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

  // ✅ UPDATED: New, more specific validation logic
  const validateField = (field, value) => {
    let error = "";
    const lower = field.toLowerCase();
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "This field is required.";
    }

    if (lower.includes("aadhar") || lower.includes("aadhaar")) {
      if (!/^\d{12}$/.test(trimmedValue)) {
        error = "Aadhaar must be exactly 12 digits.";
      }
    } else if (lower.includes("pan")) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmedValue)) {
        error = "PAN must be in the format ABCDE1234F.";
      }
    } else if (lower.includes("dob") || lower.includes("date of birth")) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
        error = "Date must be in YYYY-MM-DD format.";
      }
    } else if (lower.includes("email")) {
      if (!/.+@.+\..+/.test(trimmedValue)) {
        error = "Invalid email format.";
      }
    } else if (lower.includes("phone") || lower.includes("mobile")) {
      if (!/^\d{10}$/.test(trimmedValue)) {
        error = "Phone must be exactly 10 digits.";
      }
    }

    return error;
  };

  // ✅ UPDATED: Auto-uppercasing for PAN input
  const handleChange = (section, field, value) => {
    const lower = field.toLowerCase();
    if (lower.includes("pan")) {
      value = value.toUpperCase();
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
      return false;
    }
    alert(`✅ Section ${activeSection} saved`);
    return true;
  };

  const handleSubmitAll = async () => {
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
    try {
      let response;
      const body = JSON.stringify({ details: formValues });
      if (profileIdFromReports) {
        response = await fetch(
          `${API_BASE}/api/profiles/${profileIdFromReports}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body,
          }
        );
      } else {
        response = await fetch(`${API_BASE}/api/profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }
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
      console.error("❌ Error submitting profile: ", err);
      alert(`❌ Submission Failed: ${err.message}`);
    }
  };

  const handleBack = () => {
    const idx = sections.indexOf(activeSection);
    if (idx > 0) setActiveSection(sections[idx - 1]);
  };

  const handleNext = () => {
    if (!handleSave()) return;
    const idx = sections.indexOf(activeSection);
    if (idx < sections.length - 1) setActiveSection(sections[idx + 1]);
  };

  // ✅ UPDATED: Smarter input types and attributes, including for DOB
  const getInputProps = (field) => {
    const lower = field.toLowerCase();
    if (lower.includes("aadhar") || lower.includes("aadhaar")) {
      return { maxLength: 12, inputMode: "numeric" };
    }
    if (lower.includes("pan")) {
      return { maxLength: 10, style: { textTransform: "uppercase" } };
    }
    if (lower.includes("phone") || lower.includes("mobile")) {
      return { maxLength: 10, inputMode: "numeric" };
    }
    if (lower.includes("email")) {
      return { type: "email" };
    }
    if (lower.includes("dob") || lower.includes("date of birth")) {
      return { type: "date" };
    }
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
              {sec}
            </button>
          ))}
        </aside>
        <main className="checker-content">
          <h3>{activeSection}</h3>
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
