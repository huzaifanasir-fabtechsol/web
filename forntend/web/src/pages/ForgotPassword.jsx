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
    <div className="login-container-new">
      <style>{`
        .login-container-new {
          min-height: 100vh;
          width: 100%;
          background: url('/login-bg.png') no-repeat center center;
          background-size: cover;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          padding: 20px;
          box-sizing: border-box;
          position: relative;
        }
        
        .login-container-new::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1;
        }
        
        .login-card-new {
          background: #ffffff;
          border-radius: 4px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 410px;
          padding: 40px 35px 30px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
          position: relative;
        }

        .login-logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 25px;
        }

        .logo-symbol {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: #d9534f;
          margin-right: 8px;
        }

        .logo-text {
          font-size: 32px;
          font-weight: 800;
          color: #1a252f;
          letter-spacing: -0.5px;
        }

        .logo-dot {
          color: #d9534f;
        }

        .login-title-new {
          font-size: 13px;
          font-weight: 700;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 25px;
          text-align: center;
        }

        .form-new {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .input-group-new {
          position: relative;
          margin-bottom: 22px;
          width: 100%;
        }

        .input-new {
          width: 100%;
          height: 44px;
          padding: 10px 15px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          color: #333333;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-new:focus {
          border-color: #3498db;
        }

        .input-new.is-error {
          border-color: #d9534f;
          background-color: #fff9f9;
        }

        /* Error Badge styling to match mockup */
        .error-badge {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background-color: #d9534f;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 100;
          display: flex;
          align-items: center;
        }

        .error-badge::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: transparent #d9534f transparent transparent;
        }

        .btn-submit-new {
          width: 100%;
          height: 44px;
          background-color: #5191c1;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 5px;
          margin-bottom: 20px;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-submit-new:hover {
          background-color: #417ba8;
        }

        .btn-submit-new:disabled {
          background-color: #a0c2dc;
          cursor: not-allowed;
        }

        .link-forgot-new {
          color: #5191c1;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          margin-top: 15px;
          display: block;
        }

        .link-forgot-new:hover {
          text-decoration: underline;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive adjustments for error badges on small screens */
        @media (max-width: 768px) {
          .error-badge {
            position: static;
            transform: none;
            left: auto;
            top: auto;
            margin-top: 5px;
            white-space: normal;
          }
          .error-badge::before {
            display: none;
          }
        }
      `}</style>

      <div className="login-card-new">
        
        {/* Logo */}
        <div className="login-logo-container">
          <div className="logo-symbol">
            <i className="fa-solid fa-unlock-keyhole"></i>
          </div>
          <div className="logo-text">
            RECOVER<span className="logo-dot">.</span>
          </div>
        </div>

        <div className="login-title-new">Forgot Password</div>

        {/* Success message */}
        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '14px', borderRadius: 4, fontSize: 13, fontWeight: 500, marginBottom: 18, lineHeight: 1.45, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', boxSizing: 'border-box', width: '100%' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error alert */}
        {alertMsg && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 14px', borderRadius: 4, fontSize: 13, fontWeight: 500, marginBottom: 18, lineHeight: 1.45, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', boxSizing: 'border-box', width: '100%' }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}></i>
            <span>{alertMsg}</span>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="form-new" noValidate>
            {/* Email Address */}
            <div className="input-group-new" style={{ marginBottom: 25 }}>
              <input
                id="forgot-email"
                className={`input-new ${emailErr ? 'is-error' : ''}`}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); setAlertMsg(""); }}
                onBlur={(e) => validateEmail(e.target.value)}
                placeholder="Email Address"
              />
              {emailErr && (
                <div className="error-badge">
                  {emailErr}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="forgot-submit"
              className="btn-submit-new"
              disabled={isLoading}
            >
              {isLoading && (
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.28)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }}></div>
              )}
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <Link to="/login" className="link-forgot-new">Back to Login</Link>

      </div>
    </div>
  );
}
