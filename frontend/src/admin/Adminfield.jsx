import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Adminfield.css";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { MdSave } from "react-icons/md";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Adminfield = () => {
  const sections = ["Personal Information", "Bank Details", "C", "D", "E", "F"];
  const [activeSection, setActiveSection] = useState(sections[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsCatalog, setDetailsCatalog] = useState([]);
  const [previewData, setPreviewData] = useState(
    Object.fromEntries(sections.map((s) => [s, []]))
  );
  const navigate = useNavigate();

  const [newField, setNewField] = useState("");
  const [newFieldCategory, setNewFieldCategory] = useState(activeSection);
  const [editFieldId, setEditFieldId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    setNewFieldCategory(activeSection);
  }, [activeSection]);

  useEffect(() => {
    fetch(`${API_BASE}/api/fields`)
      .then((res) => res.json())
      .then((data) => setDetailsCatalog(data))
      .catch((err) => console.error("Error loading fields:", err));
  }, []);

  const handleLogout = () => navigate("/");

  const handleAddNewField = async () => {
    const cleanName = newField.trim();
    if (!cleanName) return;
    try {
      const res = await fetch(`${API_BASE}/api/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          section_category: newFieldCategory,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save field.");
      }
      const saved = await res.json();
      setDetailsCatalog((prev) => [...prev, saved]);
      setNewField("");
      setSubmitError("");
    } catch (err) {
      console.error("Add field error:", err);
      setSubmitError(`❌ ${err.message}`);
    }
  };

  const startEditField = (field) => {
    setEditFieldId(field.id);
    setEditValue(field.name);
  };

  const saveEditField = async () => {
    if (!editValue.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/fields/${editFieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue }),
      });
      const updated = await res.json();
      setDetailsCatalog((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
      setEditFieldId(null);
      setEditValue("");
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  const deleteField = async (id) => {
    try {
      await fetch(`${API_BASE}/api/fields/${id}`, { method: "DELETE" });
      setDetailsCatalog((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getFilteredDetails = () => {
    return detailsCatalog.filter((field) => {
      const matchesSection = field.section_category === activeSection;
      if (!matchesSection) return false;
      const matchesSearch =
        !searchQuery.trim() ||
        field.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  const assignField = (field) => {
    if (previewData[activeSection].includes(field.name)) {
      setSubmitError(
        `"${field.name}" is already in the preview for this section.`
      );
      return;
    }
    setPreviewData((prev) => ({
      ...prev,
      [activeSection]: [...prev[activeSection], field.name],
    }));
    setSubmitError("");
  };

  const removeField = (section, fieldToRemove) => {
    setPreviewData((prev) => ({
      ...prev,
      [section]: prev[section].filter((f) => f !== fieldToRemove),
    }));
  };

  const handleSubmit = () => {
    const hasPAN = Object.values(previewData).some((fields) =>
      fields.some(
        (f) => f.toLowerCase() === "pan" || f.toLowerCase() === "pan number"
      )
    );
    if (!hasPAN) {
      setSubmitError("⚠ You must assign 'PAN' before submitting.");
      return;
    }
    setSubmitError(""); // Clear error on success
    setConfirmModalOpen(true); // Open the review modal
  };

  return (
    <div className="maker-container">
      <header className="maker-header">
        <span className="brand">KYC Admin Portal</span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search available fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="preview-panel">
            <h3>Preview Selection</h3>
            {Object.values(previewData).every((arr) => arr.length === 0) ? (
              <p>No fields assigned to preview yet. Click '+' to add.</p>
            ) : (
              Object.entries(previewData).map(
                ([section, fields]) =>
                  fields.length > 0 && (
                    <div key={section} className="preview-section">
                      <h4>{section}</h4>
                      <ul>
                        {fields.map((field, index) => (
                          <li key={index}>
                            <span>{field}</span>
                            <button
                              className="remove-btn"
                              onClick={() => removeField(section, field)}
                              title={`Remove ${field}`}
                            >
                              <FaTimes />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
              )
            )}
          </div>
        </aside>

        <main className="details-area">
          <div className="section-tabs">
            {sections.map((sec) => (
              <button
                key={sec}
                className={`section-tab ${
                  activeSection === sec ? "active" : ""
                }`}
                onClick={() => setActiveSection(sec)}
              >
                {sec}
              </button>
            ))}
          </div>
          <h2>Available Fields for {activeSection}</h2>
          <div className="details-list">
            {getFilteredDetails().map((field) => (
              <div key={field.id} className="field-card">
                <span>{field.name}</span>
                <div>
                  <button
                    onClick={() => assignField(field)}
                    title="Add to Preview"
                  >
                    <FaPlus />
                  </button>
                  <button onClick={() => startEditField(field)} title="Edit">
                    <FaEdit />
                  </button>
                  <button onClick={() => deleteField(field.id)} title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="add-new-field">
            <input
              type="text"
              placeholder="Enter new field name..."
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
            />
            <select
              value={newFieldCategory}
              onChange={(e) => setNewFieldCategory(e.target.value)}
            >
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <button onClick={handleAddNewField}>
              <FaPlus /> Add Field
            </button>
          </div>
          {submitError && <div className="error-banner">{submitError}</div>}
          <div className="details-footer">
            <button className="submit-btn" onClick={() => handleSubmit()}>
              Submit ➜
            </button>
          </div>
        </main>
      </div>

      {confirmModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Confirm Submission</h4>
            <p>
              You are about to submit the following field configuration. Do you
              want to proceed?
            </p>

            <div className="final-preview">
              {Object.entries(previewData).map(
                ([section, fields]) =>
                  fields.length > 0 && (
                    <div key={section} className="section-preview">
                      <h5>{section}</h5>
                      <ul>
                        {fields.map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>

            <div className="modal-actions">
              <button
                className="confirm-btn"
                onClick={() => navigate("/maker", { state: { previewData } })}
              >
                OK
              </button>
              <button
                className="cancel-btn"
                onClick={() => setConfirmModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adminfield;
