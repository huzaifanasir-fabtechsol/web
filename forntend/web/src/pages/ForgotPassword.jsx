import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword as apiForgotPassword } from "../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const validateEmail = (val) => {
    if (!val) { setEmailErr("This field is required."); return false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(val)) { setEmailErr("Enter a valid email."); return false; }
    setEmailErr(""); return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg("");
    setSuccessMsg("");

    if (!validateEmail(email)) return;

    setIsLoading(true);
    try {
      await apiForgotPassword(email);
      setSuccessMsg("A password reset link has been sent to your email. Please check your inbox (and spam folder).");
    } catch (err) {
      setAlertMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <style>{`
        .login-page-container {
          min-height: 100vh;
          width: 100%;
          background: url('/BG.png') no-repeat center center;
          background-size: cover;
          display: flex;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient background overlay to match preview image styling */
        .login-page-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }

        .login-info-section {
          flex: 1.25;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 60px 40px;
          z-index: 10;
          position: relative;
        }

        .info-center-content {
          margin-top: auto;
          margin-bottom: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .info-horse-svg {
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .info-horse-svg svg {
          width: 100%;
          height: 100%;
        }

        .info-main-title {
          font-family: 'Playfair Display', serif;
          font-size: 46px;
          font-weight: 700;
          color: #002F24;
          margin: 12px 0 6px;
          letter-spacing: -0.5px;
        }

        .info-sub-title {
          font-size: 15px;
          font-weight: 500;
          color: #002F24;
          max-width: 320px;
          line-height: 1.5;
          margin: 0 0 25px;
          opacity: 0.9;
        }

        .info-gold-divider {
          width: 55px;
          height: 2px;
          background-color: #C5A880;
          border-radius: 2px;
        }

        .info-badges-row {
          display: flex;
          justify-content: center;
          gap: 35px;
          width: 100%;
          margin-top: auto;
        }

        .info-badge-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 110px;
        }

        .badge-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid rgba(0, 47, 36, 0.25);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #002F24;
          transition: all 0.3s ease;
        }

        .info-badge-item:hover .badge-icon-circle {
          background: rgba(255, 255, 255, 0.45);
          border-color: #002F24;
          transform: translateY(-3px);
        }

        .badge-text {
          font-size: 11px;
          font-weight: 700;
          color: #002F24;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.3;
        }

        .login-form-section {
          flex: 0.95;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 60px 40px 20px;
          z-index: 10;
          position: relative;
        }

        .login-card-new {
          background: #ffffff;
          border-radius: 36px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 480px;
          padding: 45px 40px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .school-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 25px;
          width: 100%;
        }

        .school-logo {
          height: 100px;
          object-fit: contain;
        }

        .welcome-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 700;
          color: #002F24;
          margin-bottom: 8px;
          text-align: center;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 28px;
          text-align: center;
          line-height: 1.45;
        }

        .form-new {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .input-group-new {
          margin-bottom: 25px;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 12.5px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
          text-align: left;
        }

        .input-container-inner {
          position: relative;
          width: 100%;
        }

        .input-icon-left {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 15px;
        }

        .input-new {
          width: 100%;
          height: 52px;
          padding: 10px 16px 10px 46px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
          color: #0f172a;
          background-color: #ffffff;
          box-sizing: border-box;
          outline: none;
          transition: all 0.2s ease;
        }

        .input-new::placeholder {
          color: #94a3b8;
        }

        .input-new:focus {
          border-color: #002F24;
          box-shadow: 0 0 0 3px rgba(0, 47, 36, 0.08);
        }

        .input-new.is-error {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          text-align: left;
        }

        .btn-signin {
          width: 100%;
          height: 52px;
          background-color: #002F24;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn-signin:hover {
          background-color: #004838;
        }

        .btn-signin:disabled {
          background-color: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .btn-signin i {
          font-size: 13px;
          transition: transform 0.2s ease;
        }

        .btn-signin:hover:not(:disabled) i {
          transform: translateX(3px);
        }

        .back-to-login {
          font-size: 14px;
          font-weight: 600;
          color: #002F24;
          text-decoration: none;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
        }

        .back-to-login:hover {
          text-decoration: underline;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive styling for smaller devices */
        @media (max-width: 1023px) {
          .login-page-container {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px 16px;
          }

          .login-info-section {
            display: none;
          }

          .login-form-section {
            flex: 1;
            width: 100%;
            padding: 0;
          }

          .login-card-new {
            max-width: 100%;
            padding: 40px 24px;
            border-radius: 28px;
          }
        }
      `}</style>

      {/* Left panel: Info & brand representation */}
      <div className="login-info-section">
        <div className="info-center-content">
          <div className="info-horse-svg">
            <svg viewBox="0 0 120 120" fill="none" stroke="#002F24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Stylized horse outline facing left */}
              <path d="M75,95 C75,80 78,55 70,40 C66,32 58,25 58,18 C58,15 62,12 65,15 C68,18 70,25 70,30" />
              <path d="M58,18 C54,14 48,15 48,22 C48,25 50,30 52,32" />
              <path d="M53,24 C50,20 44,21 44,28 C44,31 46,36 48,38" />
              <path d="M52,32 C48,35 40,40 38,48 C36,55 35,62 30,68 C26,72 20,74 24,78 C28,82 35,80 39,76 C43,72 45,65 48,60" />
              <path d="M48,60 C50,65 52,70 56,73 C60,76 66,75 70,70 M30,68 L32,71" />
              <path d="M 32,88 C 50,95 70,95 88,88" stroke="#C5A880" strokeWidth="1.8" />
            </svg>
          </div>

          {/* <h1 className="info-main-title">Ride. Learn. Grow.</h1>
          <p className="info-sub-title">Empowering riders of all levels with passion and care.</p>
          <div className="info-gold-divider"></div> */}
        </div>

        {/* Badges footer */}
        {/* <div className="info-badges-row">
          <div className="info-badge-item">
            <div className="badge-icon-circle">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span className="badge-text">Expert Trainers</span>
          </div>
          <div className="info-badge-item">
            <div className="badge-icon-circle">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <span className="badge-text">Safe & Trusted</span>
          </div>
          <div className="info-badge-item">
            <div className="badge-icon-circle">
              <i className="fa-solid fa-award"></i>
            </div>
            <span className="badge-text">Excellence in Every Ride</span>
          </div>
        </div> */}
      </div>

      {/* Right panel: Forgot Password card form */}
      <div className="login-form-section">
        <div className="login-card-new">

          {/* School logo */}
          <div className="school-logo-container">
            <img src="/logo.png" alt="Horse Riding School Logo" className="school-logo" />
          </div>

          <h2 className="welcome-title">Forgot Password</h2>
          <p className="welcome-subtitle">
            {successMsg ? "Check your email for details" : "Enter your email address to receive a password reset link"}
          </p>

          {/* Success message */}
          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px', borderRadius: 12, fontSize: 13.5, fontWeight: 500, marginBottom: 20, lineHeight: 1.45, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', boxSizing: 'border-box', width: '100%' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }}></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error alert */}
          {alertMsg && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 500, marginBottom: 20, lineHeight: 1.45, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', boxSizing: 'border-box', width: '100%' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}></i>
              <span>{alertMsg}</span>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="form-new" noValidate>

              {/* Email Address Input */}
              <div className="input-group-new">
                <label className="form-label" htmlFor="forgot-email">Email Address</label>
                <div className="input-container-inner">
                  <i className="fa-regular fa-envelope input-icon-left"></i>
                  <input
                    id="forgot-email"
                    className={`input-new ${emailErr ? 'is-error' : ''}`}
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); setAlertMsg(""); }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                {emailErr && (
                  <div className="error-message">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {emailErr}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="forgot-submit"
                className="btn-signin"
                disabled={isLoading}
              >
                {isLoading && (
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.28)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }}></div>
                )}
                <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
                {!isLoading && <i className="fa-solid fa-arrow-right"></i>}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <Link to="/login" className="back-to-login">
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back to Login</span>
          </Link>

        </div>
      </div>
    </div>
  );
}
