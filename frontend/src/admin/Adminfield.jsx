import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Adminfield.css";

// React Icons
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { MdSave } from "react-icons/md";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Adminfield = () => {
  // ✅ FIX: Default section name updated
  const [activeSection, setActiveSection] = useState("Personal Information");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsCatalog, setDetailsCatalog] = useState([]);
  // ✅ FIX: Key in previewData object updated for consistency
  const [previewData, setPreviewData] = useState({
    "Personal Information": [],
    B: [],
    C: [],
    D: [],
    E: [],
    F: [],
  });
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  // ✅ FIX: Default chosen section updated
  const [chosenSection, setChosenSection] = useState("Personal Information");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [newField, setNewField] = useState("");
  const [editFieldId, setEditFieldId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/fields`)
      .then((res) => res.json())
      .then((data) => setDetailsCatalog(data))
      .catch((err) => console.error("Error loading fields:", err));
  }, []);

  const handleLogout = () => {
    navigate("/");
  };

  const handleAddNewField = async () => {
    const cleanName = newField.trim();
    if (!cleanName) return;
    try {
      const res = await fetch(`${API_BASE}/api/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName }),
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
            <h3>Selected ({activeSection})</h3>
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
            {/* ✅ FIX: Array updated to use the new name */}
            {["Personal Information", "B", "C", "D", "E", "F"].map((sec) => (
              <button
                key={sec}
                className={`section-tab ${
                  activeSection === sec ? "active" : ""
                }`}
                onClick={() => setActiveSection(sec)}
              >
                {sec === "Personal Information" ? sec : `Section ${sec}`}
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

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Assign “{selectedField}”</h4>
            <div className="modal-options">
              {/* ✅ FIX: Array in modal updated to use the new name */}
              {["Personal Information", "B", "C", "D", "E", "F"].map((sec) => (
                <label key={sec}>
                  <input
                    type="radio"
                    value={sec}
                    checked={chosenSection === sec}
                    onChange={(e) => setChosenSection(e.target.value)}
                  />
                  {sec === "Personal Information" ? sec : `Section ${sec}`}
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
                      <h4>
                        {sec === "Personal Information"
                          ? sec
                          : `Section ${sec}`}
                      </h4>
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
