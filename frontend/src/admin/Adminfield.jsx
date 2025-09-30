import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Adminfield.css";

// React Icons
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { MdSave } from "react-icons/md";

const API_BASE = "http://localhost:5000/api"; // ✅ backend server

const Adminfield = () => {
  const [activeSection, setActiveSection] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsCatalog, setDetailsCatalog] = useState([]); // fields from DB
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

  // ✅ Load fields from DB on mount
  useEffect(() => {
    fetch(`${API_BASE}/fields`)
      .then((res) => res.json())
      .then((data) => setDetailsCatalog(data)) // data = [{id, name}]
      .catch((err) => console.error("Error loading fields:", err));
  }, []);

  // ✅ Logout function
  const handleLogout = () => {
    navigate("/"); // redirect to login page
  };

  // ✅ Add new field
  const handleAddNewField = async () => {
    const cleanName = newField.trim();
    if (!cleanName) return;

    try {
      const res = await fetch(`${API_BASE}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName }),
      });
      const saved = await res.json();
      setDetailsCatalog((prev) => [...prev, saved]); // keep full object
      setNewField("");
    } catch (err) {
      console.error("Add field error:", err);
      setSubmitError("❌ Failed to save field.");
    }
  };

  // ✅ Start editing field
  const startEditField = (field) => {
    setEditFieldId(field.id);
    setEditValue(field.name);
  };

  // ✅ Save edited field
  const saveEditField = async () => {
    if (!editValue.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/fields/${editFieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue }),
      });
      const updated = await res.json();
      setDetailsCatalog((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );

      setPreviewData((prev) => {
        const updatedPreview = {};
        for (let sec in prev) {
          updatedPreview[sec] = prev[sec].map((fld) =>
            fld === editValue ? updated.name : fld
          );
        }
        return updatedPreview;
      });

      setEditFieldId(null);
      setEditValue("");
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  // ✅ Delete field
  const deleteField = async (id) => {
    try {
      await fetch(`${API_BASE}/fields/${id}`, { method: "DELETE" });
      setDetailsCatalog((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ✅ Filter list
  const getFilteredDetails = () =>
    !searchQuery.trim()
      ? detailsCatalog
      : detailsCatalog.filter((f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

  // ✅ Modal open / assign
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

  // ✅ Remove field from preview
  const removeField = (section, fieldToRemove) => {
    setPreviewData((prev) => {
      const updated = { ...prev };
      updated[section] = updated[section].filter((f) => f !== fieldToRemove);
      return updated;
    });
  };

  // ✅ Submit — open preview modal
  const handleSubmit = () => {
    const hasPAN = Object.values(previewData).some((fields) =>
      fields.includes("PAN")
    );
    if (!hasPAN) {
      setSubmitError("⚠ You must assign 'PAN' before submitting.");
      return;
    }
    // open modal for review instead of navigating
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
        {/* Sidebar preview */}
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

        {/* Main area */}
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

      {/* Assign modal */}
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
            {errorMessage && <p className="error">{errorMessage}</p>}
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

      {/* Review/Submit Modal */}
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
