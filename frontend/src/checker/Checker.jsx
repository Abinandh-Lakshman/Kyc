import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Checker.css";

import { API_BASE } from '../admin/Adminfield';
const Checker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const formValues = location.state?.formValues || {};
  const previewData = location.state?.previewData || {};
  const profileId = location.state?.profileId; // ✅ get profileId passed from Maker

  const [verifiedFields, setVerifiedFields] = useState(
    location.state?.verifiedFields || {}
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [startTime] = useState(Date.now());

  // ✅ Toggle verification checkbox
  const toggleVerify = (section, field) => {
    setVerifiedFields((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section]?.[field],
      },
    }));
  };

  // ✏ Go back to Maker for editing
  const handleEdit = (section) => {
    navigate("/maker", {
      replace: true,
      state: {
        formValues,
        previewData,
        activeSection: section,
        verifiedFields,
        profileId, // ✅ keep profileId intact when editing
      },
    });
  };

  // 🚀 Submit → update backend first, then go to Reports
  // Replace your handleSubmit function with this corrected version
  const handleSubmit = async () => {
    try {
      if (profileId) {
        // --- THE FIX IS ON THIS LINE ---
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

  // --- Stats Calculation ---
  const totalFields = Object.entries(formValues).reduce(
    (acc, [_, fields]) => acc + Object.keys(fields).length,
    0
  );

  let verifiedCount = 0;
  Object.entries(formValues).forEach(([section, fields]) => {
    Object.keys(fields).forEach((field) => {
      if (verifiedFields[section]?.[field]) {
        verifiedCount++;
      }
    });
  });

  const notVerifiedCount = totalFields - verifiedCount;
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // --- Filter ---
  const shouldShowRow = (field) => {
    if (
      searchQuery &&
      !field.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  };

  return (
    <div className="reports-container">
      <h2>KYC Report Verification</h2>
      <div className="summary-dashboard">
        <div className="stat-card">Total: {totalFields}</div>
        <div className="stat-card">✅ Verified: {verifiedCount}</div>
        <div className="stat-card">❌ Not Verified: {notVerifiedCount}</div>
      </div>

      {/* ✅ Search Field */}
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
              <div className="section-header">
                <h4>Section {section}</h4>
              </div>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                    <th>Verified</th>
                    <th>Action</th>
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
                        <td>
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(section)}
                          >
                            Edit
                          </button>
                        </td>
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
