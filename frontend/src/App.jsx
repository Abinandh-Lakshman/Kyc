import { useState } from "react";
import "./App.css";
import Login from "./Login/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Adminfield from "./admin/Adminfield";
import Maker from "./maker/Maker";
import Checker from "./checker/Checker";
import Reports from "./reports/Reports";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/adminfield" element={<Adminfield />} />
        <Route path="/maker" element={<Maker />} />
        <Route path="/checker" element={<Checker />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}

export default App;
