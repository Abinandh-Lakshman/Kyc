import React, { useState } from "react";
import "./Reports.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { API_BASE } from "../admin/Adminfield";

const Reports = () => {
  const [panInput, setPanInput] = useState("");
  const [error, setError] = useState("");
  const [matchedData, setMatchedData] = useState(null);
  const [verifiedFields, setVerifiedFields] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [fileFormat, setFileFormat] = useState("excel");

  const handleVerifyPan = async () => {
    if (!panInput.trim()) {
      setError("⚠ Please enter a PAN number.");
      setMatchedData(null);
      return;
    }
    try {
      setMatchedData(null);
      const res = await fetch(
        `${API_BASE}/api/profiles/by-pan/${panInput.toUpperCase().trim()}`
      );
      const data = await res.json();

      if (!data || !data.length) {
        setError("❌ No record found for this PAN.");
        setMatchedData(null);
      } else {
        setError("");
        setVerifiedFields(data[0].verified || {});
        setMatchedData(data[0].details);
      }
    } catch (err) {
      console.error("❌ Error fetching by PAN", err);
      setError("Failed to fetch from backend.");
      setMatchedData(null);
    }
  };

  const getStatus = (section, field) => {
    const isVerified = verifiedFields[section]?.[field];
    if (isVerified === true) return "✅ Verified";
    if (isVerified === false) return "❌ Not Verified";
    return "⏳ Pending";
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    Object.entries(matchedData).forEach(([section, fields]) => {
      const rows = Object.entries(fields).map(([field, value]) => ({
        Field: field,
        Value: value,
        Verified: getStatus(section, field),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Section ${section}`);
    });
    XLSX.writeFile(wb, "kyc_report.xlsx");
  };

  const exportCSV = () => {
    let csvContent = "";
    Object.entries(matchedData).forEach(([section, fields]) => {
      csvContent += `Section ${section}\nField,Value,Verified\n`;
      Object.entries(fields).forEach(([field, value]) => {
        const status = getStatus(section, field);
        csvContent += `"${field}","${value}","${status}"\n`;
      });
      csvContent += "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "kyc_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    Object.entries(matchedData).forEach(([section, fields], index) => {
      const rows = Object.entries(fields).map(([field, value]) => [
        field,
        value,
        getStatus(section, field),
      ]);
      doc.setFontSize(14);
      doc.text(`Section ${section}`, 14, 15);
      autoTable(doc, {
        startY: 25,
        head: [["Field", "Value", "Verified"]],
        body: rows,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 160, 133] },
      });
      if (index < Object.keys(matchedData).length - 1) doc.addPage();
    });
    doc.save("kyc_report.pdf");
  };

  const handleDownload = () => {
    if (!matchedData) return;
    if (fileFormat === "excel") exportExcel();
    else if (fileFormat === "csv") exportCSV();
    else if (fileFormat === "pdf") exportPDF();
  };

  const shouldShowRow = (field) => {
    return (
      !searchQuery || field.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="reports-container">
      <h2>KYC Report Verification</h2>
      <div className="pan-verification">
        <h3>Enter PAN to view report</h3>
        <div className="pan-input-box">
          <input
            type="text"
            placeholder="Enter PAN number"
            value={panInput}
            onChange={(e) => setPanInput(e.target.value.toUpperCase())}
            maxLength={10}
          />
          <button onClick={handleVerifyPan}>Verify & Generate</button>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>
      {matchedData && (
        <div className="final-report">
          <h3>📄 Final KYC Report for {panInput}</h3>
          <div className="filters">
            <input
              type="text"
              placeholder="Search for field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {Object.entries(matchedData).map(
            ([section, fields]) =>
              Object.keys(fields).length > 0 && (
                <div key={section} className="summary-section-block">
                  <h4>Section {section}</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    {/* ✅ FIX: This logic is now bulletproof */}
                    <tbody>
                      {Object.entries(fields)
                        .filter(([field]) => shouldShowRow(field))
                        .map(([field, value]) => (
                          <tr key={field}>
                            <td>{field}</td>
                            <td>{value}</td>
                            <td>{getStatus(section, field)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )
          )}
          <div className="export-controls">
            <select
              value={fileFormat}
              onChange={(e) => setFileFormat(e.target.value)}
            >
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <button onClick={handleDownload}>Download</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
