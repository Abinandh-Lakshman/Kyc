import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Adminfield.css";

// React Icons
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { MdSave } from "react-icons/md";

// This is correct and does not need to be changed.
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Adminfield = () => {
  const [activeSection, setActiveSection] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsCatalog, setDetailsCatalog] = useState([]);
  const [previewData, setPreviewData] = useState({
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
    F: [],
  });
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [chosenSection, setChosenSection] = useState("A");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [newField, setNewField] = useState("");
  const [editFieldId, setEditFieldId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [submitError, setSubmitError] = useState("");

  // ✅ CORRECTED - Loads fields from the DB on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/fields`) // Correctly has /api
      .then((res) => res.json())
      .then((data) => setDetailsCatalog(data))
      .catch((err) => console.error("Error loading fields:", err));
  }, []);

  const handleLogout = () => {
    navigate("/");
  };

  // ✅ CORRECTED - Adds a new field
  const handleAddNewField = async () => {
    const cleanName = newField.trim();
    if (!cleanName) return;

    try {
      const res = await fetch(`${API_BASE}/api/fields`, {
        // Correctly has /api
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName }),
      });
      const saved = await res.json();
      setDetailsCatalog((prev) => [...prev, saved]);
      setNewField("");
    } catch (err) {
      console.error("Add field error:", err);
      setSubmitError("❌ Failed to save field.");
    }
  };

  const startEditField = (field) => {
    setEditFieldId(field.id);
    setEditValue(field.name);
  };

  // ✅ CORRECTED - Saves an edited field
  const saveEditField = async () => {
    if (!editValue.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/fields/${editFieldId}`, {
        // Correctly has /api
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

  // ✅ CORRECTED - Deletes a field
  const deleteField = async (id) => {
    try {
      await fetch(`${API_BASE}/api/fields/${id}`, { method: "DELETE" }); // Correctly has /api
      setDetailsCatalog((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getFilteredDetails = () =>
    !searchQuery.trim()
      ? detailsCatalog
      : detailsCatalog.filter((f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const openModal = (field) => {
    setSelectedField(field.name);
    setChosenSection(activeSection);
    setModalOpen(true);
  };

  const confirmAssign = () => {
    if (selectedField && chosenSection) {
      setPreviewData((prev) => {
        const updated = { ...prev };
        if (!updated[chosenSection].includes(selectedField)) {
          updated[chosenSection] = [...updated[chosenSection], selectedField];
        }
        return updated;
      });
      setModalOpen(false);
      setSelectedField(null);
    }
  };

  const removeField = (section, fieldToRemove) => {
    setPreviewData((prev) => {
      const updated = { ...prev };
      updated[section] = updated[section].filter((f) => f !== fieldToRemove);
      return updated;
    });
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

  // --- The rest of your JSX and component logic ---
  // (This part was already correct and does not need changes)
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
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="preview-panel">
            <h3>Selected (Section {activeSection})</h3>
            {previewData[activeSection].length === 0 ? (
              <p>No fields assigned</p>
            ) : (
              <ul>
                {previewData[activeSection].map((fld, i) => (
                  <li key={i} className="preview-item">
                    <strong>{fld}</strong>
                    <button
                      className="remove-btn"
                      onClick={() => removeField(activeSection, fld)}
                      title="Remove Field"
                    >
                      <FaTimes />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="details-area">
          <div className="section-tabs">
            {["A", "B", "C", "D", "E", "F"].map((sec) => (
              <button
                key={sec}
                className={`section-tab ${
                  activeSection === sec ? "active" : ""
                }`}
                onClick={() => setActiveSection(sec)}
              >
                Section {sec}
              </button>
            ))}
          </div>

          <h2>Available Fields ({detailsCatalog.length})</h2>

          <div className="details-list">
            {getFilteredDetails().map((field) => (
              <div key={field.id} className="field-card">
                {editFieldId === field.id ? (
                  <>
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <button onClick={saveEditField} title="Save">
                      <MdSave />
                    </button>
                  </>
                ) : (
                  <>
                    <span>{field.name}</span>
                    <div>
                      <button onClick={() => openModal(field)} title="Assign">
                        <FaPlus />
                      </button>
                      <button
                        onClick={() => startEditField(field)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </>
                )}
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

      {/* ... (rest of your modal JSX) ... */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Assign “{selectedField}”</h4>
            <div className="modal-options">
              {["A", "B", "C", "D", "E", "F"].map((sec) => (
                <label key={sec}>
                  <input
                    type="radio"
                    value={sec}
                    checked={chosenSection === sec}
                    onChange={(e) => setChosenSection(e.target.value)}
                  />
                  Section {sec}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={confirmAssign}>Confirm</button>
              <button
                className="cancel-btn"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModalOpen && (
        <div className="modal-overlay">
          <div className="modal large">
            <h3>Review Your Selection</h3>
            <div className="final-preview">
              {Object.entries(previewData).map(
                ([sec, fields]) =>
                  fields.length > 0 && (
                    <div key={sec} className="section-preview">
                      <h4>Section {sec}</h4>
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
