import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword as apiForgotPassword } from "../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (val) => {
    if (!val) { setEmailErr("Email is required."); return false; }
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
    <div className="page" style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <style>{`
        .left-panel::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.15) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* LEFT PANEL */}
      <div className="left-panel" style={{ width: '44%', minHeight: '100vh', background: 'linear-gradient(180deg, #f97316 0%, #ea6c0a 60%, #c2550a 100%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 36px' }}>
        <div className="blob blob-1" style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', width: 280, height: 280, background: 'rgba(255,255,255,.10)', top: -70, left: -70 }}></div>
        <div className="blob blob-2" style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', width: 200, height: 200, background: 'rgba(0,0,0,.08)', bottom: -50, right: 10 }}></div>

        <div className="brand-content" style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}>
          <div className="brand-logo-wrap" style={{ width: 88, height: 88, background: 'var(--active)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 28px rgba(0,0,0,.28)' }}>
            <i className="fa-solid fa-unlock-keyhole" style={{ fontSize: 38, color: 'var(--accent1)' }}></i>
          </div>
          <div className="brand-name" style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-.3px', lineHeight: 1.2, marginBottom: 4 }}>Password Recovery</div>
          <p className="brand-tagline" style={{ fontSize: 13.5, fontWeight: 400, color: 'rgba(255,255,255,.72)', lineHeight: 1.7, maxWidth: 260, margin: '16px auto 0' }}>
            Don't worry, it happens. Enter the email associated with your account and we'll send you a reset link.
          </p>
        </div>
        <div className="left-footer" style={{ position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 2, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.35)' }}>© 2026 HRS Management System</div>
      </div>

      {/* CLOUD BORDER */}
      <svg className="cloud-svg" viewBox="0 0 88 600" preserveAspectRatio="none" style={{ position: 'absolute', left: '44%', top: 0, height: '100%', width: 88, zIndex: 10, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="60%" stopColor="#ea6c0a"/>
            <stop offset="100%" stopColor="#c2550a"/>
          </linearGradient>
        </defs>
        <path d="M 0,0 L 0,600 C 88,600 88,400 0,400 C 88,400 88,200 0,200 C 88,200 88,0 0,0 Z" fill="url(#og)"/>
      </svg>

      {/* RIGHT PANEL */}
      <div className="right-panel" style={{ flex: 1, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 40px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        <div className="deco-circle dc-1" style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', width: 260, height: 260, background: 'rgba(249,115,22,.07)', bottom: -80, right: -80 }}></div>

        <div className="login-card" style={{ width: '100%', maxWidth: 380, zIndex: 2 }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-soft)', textDecoration: 'none', marginBottom: 24, fontWeight: 500 }}>
            <i className="fa-solid fa-arrow-left"></i> Back to login
          </Link>

          <p className="card-role" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--text-dark)', marginBottom: 8, lineHeight: 1.1 }}>Forgot Password?</p>
          <p className="card-sub" style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 24 }}>Enter your email address and we'll send you a link to reset your password.</p>

          {/* Success message */}
          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 18, lineHeight: 1.45, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error alert */}
          {alertMsg && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 18, lineHeight: 1.45, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}></i>
              <span>{alertMsg}</span>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 7 }}>Email Address</label>
                <div className="input-wrap" style={{ position: 'relative' }}>
                  <i className="fa-solid fa-envelope input-icon" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-soft)', pointerEvents: 'none' }}></i>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); setAlertMsg(""); }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    placeholder="admin@example.com"
                    style={{ width: '100%', height: 47, padding: '0 42px 0 40px', border: `1.5px solid ${emailErr ? '#ef4444' : 'var(--border)'}`, borderRadius: 10, fontSize: 13.5, fontFamily: 'Inter', color: 'var(--text-dark)', background: 'var(--bg)', outline: 'none' }}
                  />
                </div>
                {emailErr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500, color: '#ef4444', marginTop: 5 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 10 }}></i>
                    <span>{emailErr}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                id="forgot-submit"
                disabled={isLoading}
                style={{ width: '100%', height: 47, background: 'var(--active)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isLoading ? 0.65 : 1 }}
              >
                {isLoading && <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.28)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }}></div>}
                {!isLoading && <span>Send Reset Link</span>}
                {isLoading && <span>Sending…</span>}
              </button>
            </form>
          )}

          {successMsg && (
            <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, fontWeight: 600, color: 'var(--accent1)', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
