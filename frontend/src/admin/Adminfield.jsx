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
  const [detailsCatalog, setDetailsCatalog] = useState([]); // This will hold ALL fields from the DB
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

  // ✅ NEW: This effect keeps the "Add New" dropdown in sync with the active tab.
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

  // ✅ UPDATED: Now sends the section_category to the backend when creating a field.
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

  // ✅ REWRITTEN: This is the core logic. It filters the main list to only show
  // fields that belong to the currently active section.
  const getFilteredDetails = () => {
    return detailsCatalog.filter((field) => {
      // 1. Filter by the active section category
      const matchesSection = field.section_category === activeSection;
      if (!matchesSection) return false;

      // 2. Then, filter by the search query (if there is one)
      const matchesSearch =
        !searchQuery.trim() ||
        field.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  // ✅ REWRITTEN: The modal is gone. This function now directly assigns a field to the preview.
  const assignField = (field) => {
    // Check if the field is already in the preview for this section
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
    setSubmitError(""); // Clear any previous errors
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
    setConfirmModalOpen(true);
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
          {/* Sidebar content is mostly the same */}
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
                  {/* ✅ UPDATED: Button now calls the simplified assignField function */}
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

          {/* ✅ UPDATED: "Add New Field" UI now includes a category selector */}
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
            <button className="submit-btn" onClick={handleSubmit}>
              Submit ➜
            </button>
          </div>
        </main>
      </div>

      {/* The assignment modal has been removed, but the confirm/submit modal remains */}
      {confirmModalOpen && (
        <div className="modal-overlay">
          <div className="modal large">
            <h3>Review Your Selection</h3>
            <div className="final-preview">
              {Object.entries(previewData).map(
                ([sec, fields]) =>
                  fields.length > 0 && (
                    <div key={sec} className="section-preview">
                      <h4>{sec}</h4>
                      <ul>
                        {fields.map((fld, i) => (
                          <li key={i}>{fld}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={() => navigate("/maker", { state: { previewData } })}
              >
                Submit
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
