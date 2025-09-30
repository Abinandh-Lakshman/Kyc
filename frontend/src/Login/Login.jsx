import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import loginIllustration from "../assets/Team-bro.png";

const Login = () => {
  const [signState, setSignState] = useState("Sign In");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 🔑 Check credentials when signing in
      if (signState === "Sign In") {
        if (username === "admin" && password === "Quanticus@123") {
          // Success → generate fake token
          const fakeToken = Math.random().toString(36).substring(2);
          localStorage.setItem("token", fakeToken);

          alert(" Logged in successfully!");
          navigate("/adminField");
        } else {
          setError(" Invalid credentials.Please Enter the Correct Credentials");
          return;
        }
      } else {
        // Sign up logic stays fake
        alert("✅ Account created successfully! You can now sign in.");
        setSignState("Sign In");
      }

      // Reset fields if success or after switching states
      setUsername("");
      setPassword("");
      setError("");
    } catch (err) {
      setError(" Unexpected login error");
    }
  };

  return (
    <div className="login-page-wrapper corporate-split">
      {/* --- Left Panel with Illustration --- */}
      <div className="login-visual-panel">
        <div className="visual-content">
          <img
            src={loginIllustration}
            alt="KYC Illustration"
            className="login-illustration"
          />
          <div className="text-content">
            <h1>Secure KYC Portal</h1>
            <p>The industry standard for identity verification</p>
          </div>
        </div>
      </div>

      {/* --- Right Panel with Form --- */}
      <div className="login-form-panel">
        <div className="login-box">
          <div className="login-header">
            <h2>
              {signState === "Sign In"
                ? "Sign In to Your Account"
                : "Create a New Account"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="submit-btn">
              {signState}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
