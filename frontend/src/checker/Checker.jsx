import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Checker.css";
import { API_BASE } from "../admin/Adminfield";

const Checker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const formValues = location.state?.formValues || {};
  const previewData = location.state?.previewData || {};
  const profileId = location.state?.profileId;

  const [verifiedFields, setVerifiedFields] = useState(
    location.state?.verifiedFields || {}
  );

  const [searchQuery, setSearchQuery] = useState("");

  // This functionality is unchanged
  const toggleVerify = (section, field) => {
    setVerifiedFields((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section]?.[field],
      },
    }));
  };

  // This functionality is unchanged
  const handleEdit = (section) => {
    navigate("/maker", {
      replace: true,
      state: {
        formValues,
        previewData,
        activeSection: section,
        verifiedFields,
        profileId,
      },
    });
  };

  // This functionality is unchanged
  const handleSubmit = async () => {
    try {
      if (profileId) {
        await fetch(`${API_BASE}/api/profiles/${profileId}/verify`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verified: verifiedFields }),
        });
      }

      navigate("/reports", {
        replace: true,
        state: { formValues, previewData, verifiedFields, profileId },
      });
    } catch (err) {
      console.error("❌ Error updating verification: ", err);
      alert("❌ Failed to submit verification. Please try again.");
    }
  };

  const totalFields = Object.values(formValues).reduce(
    (acc, fields) => acc + Object.keys(fields).length,
    0
  );

  const verifiedCount = Object.values(verifiedFields).reduce(
    (acc, section) => acc + Object.values(section).filter(Boolean).length,
    0
  );

  const notVerifiedCount = totalFields - verifiedCount;

  const shouldShowRow = (field) => {
    return (
      !searchQuery || field.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="reports-container">
      <h2>KYC Report Verification</h2>
      <div className="summary-dashboard">
        <div className="stat-card">Total: {totalFields}</div>
        <div className="stat-card">✅ Verified: {verifiedCount}</div>
        <div className="stat-card">❌ Not Verified: {notVerifiedCount}</div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search for field..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {Object.entries(formValues).map(
        ([section, fields]) =>
          Object.keys(fields).length > 0 && (
            <div key={section} className="section-container">
              {/* ✅ FIX: The "Edit" button is now here, in the header. Its functionality is the same. */}
              <div className="section-header">
                <h4>Section {section}</h4>
                <button
                  className="edit-btn-header"
                  onClick={() => handleEdit(section)}
                >
                  Edit Section
                </button>
              </div>
              <table className="report-table">
                {/* ✅ FIX: Removed the "Action" column header */}
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fields)
                    .filter(([field]) => shouldShowRow(field))
                    .map(([field, value]) => (
                      <tr key={field}>
                        <td>{field}</td>
                        <td>{value}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={verifiedFields[section]?.[field] || false}
                            onChange={() => toggleVerify(section, field)}
                          />
                        </td>
                        {/* ✅ FIX: Removed the button from every single row */}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )
      )}

      <div className="submit-area">
        <button className="submit-btn" onClick={handleSubmit}>
          Submit Verification
        </button>
      </div>
    </div>
  );
};

export default Checker;
