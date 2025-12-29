import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/adminlogo.webp";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const DEFAULT_USERNAME = "admin";
  const DEFAULT_PASSWORD = "admin123";

  const savedUsername =
    localStorage.getItem("admin_username") || DEFAULT_USERNAME;
  const savedPassword =
    localStorage.getItem("admin_password") || DEFAULT_PASSWORD;

  const [resetUsername, setResetUsername] = useState(savedUsername);

  // 🔒 Disable scroll on login page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const showTempMessage = (msg) => {
    setModalMessage(msg);
    setTimeout(() => setModalMessage(""), 2000);
  };

  // ✅ FIXED LOGIN HANDLER
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (username === savedUsername && password === savedPassword) {
        // ✅ STORE BOOLEAN STRING (IMPORTANT)
        sessionStorage.setItem("admin", "true");

        navigate("/", { replace: true });
      } else {
        setError("❌ Invalid username or password");
      }

      setLoading(false);
    }, 600);
  };

  const handleSendOtp = () => {
    if (!email.trim()) {
      showTempMessage("Please enter your email.");
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9](\.?[a-zA-Z0-9]){2,}@gmail\.com$/;

    if (!gmailRegex.test(email)) {
      showTempMessage("Enter a valid Gmail address (example@gmail.com).");
      return;
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otpCode);

    setModalMessage(`OTP sent successfully! (${otpCode})`);
    setStep(2);
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setResetUsername(savedUsername);
      setModalMessage("OTP verified successfully!");
      setStep(3);
    } else {
      showTempMessage("Incorrect OTP. Try again.");
    }
  };

  const handlePasswordReset = () => {
    if (!resetUsername.trim()) {
      showTempMessage("Username cannot be empty.");
      return;
    }
    if (!newPassword.trim()) {
      showTempMessage("Password cannot be empty.");
      return;
    }

    localStorage.setItem("admin_username", resetUsername);
    localStorage.setItem("admin_password", newPassword);

    setModalMessage("Login details updated successfully!");

    setTimeout(() => {
      setShowModal(false);
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
      setModalMessage("");
    }, 1000);
  };

  return (
    <div
      className="w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        fontFamily: "Poppins, sans-serif",
        background: "#f2f5f9",
        overflow: "hidden",
      }}
    >
      <div
        className="p-4"
        style={{
          width: "480px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.55)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="text-center mb-3">
          <img
            src={logo}
            alt="Logo"
            style={{ height: 80, width: 300, objectFit: "contain" }}
          />
        </div>

        <h3 className="text-center fw-bold text-primary">Hello Admin!</h3>

        {/* LOGIN */}
        <form onSubmit={handleLogin}>
          <div className="mb-2">
            <label className="fw-semibold">Username</label>
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="fw-semibold">Password</label>
            <input
              type="password"
              className="form-control shadow-sm"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 shadow"
            disabled={loading}
            style={{
              background: "rgba(0,123,255,0.95)",
              color: "white",
              padding: "10px",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && (
          <p className="text-center text-danger mt-2 fw-semibold">{error}</p>
        )}

        <div className="text-center mt-2">
          <button
            className="btn btn-link fw-semibold"
            onClick={() => setShowModal(true)}
          >
            Forgot Password?
          </button>
        </div>
      </div>

      {/* RESET MODAL */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div
            className="bg-white rounded shadow"
            style={{
              width: "400px",
              padding: "20px",
              overflow: "hidden",
            }}
          >
            <h4 className="fw-bold text-center">Reset Login Details</h4>

            {modalMessage && (
              <p className="text-center fw-semibold text-primary">
                {modalMessage}
              </p>
            )}

            {step === 1 && (
              <>
                <label className="fw-semibold">Enter your Gmail</label>
                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn btn-primary w-100" onClick={handleSendOtp}>
                  Send OTP
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <label className="fw-semibold">Enter OTP</label>
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="4-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <button className="btn btn-success w-100" onClick={handleVerifyOtp}>
                  Verify OTP
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <label className="fw-semibold">New Username</label>
                <input
                  type="text"
                  className="form-control mb-3"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                />

                <label className="fw-semibold">New Password</label>
                <input
                  type="password"
                  className="form-control mb-3"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button
                  className="btn btn-primary w-100"
                  onClick={handlePasswordReset}
                >
                  Update Login Details
                </button>
              </>
            )}

            <button
              className="btn btn-danger w-100 mt-3"
              onClick={() => {
                setShowModal(false);
                setStep(1);
                setModalMessage("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
