import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { saveSession, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // If already authenticated, skip to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  // Restore remember me
  useEffect(() => {
    const saved = localStorage.getItem("hrs_remember");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // validation regex
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (val) => {
    if (!val) { setEmailErr("Email is required."); return false; }
    if (!emailRe.test(val)) { setEmailErr("Enter a valid email."); return false; }
    setEmailErr(""); return true;
  };

  const validatePw = (val) => {
    if (!val) { setPwErr("Password is required."); return false; }
    if (val.length < 6) { setPwErr("Minimum 6 characters."); return false; }
    setPwErr(""); return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlertMsg("");

    const isEmailValid = validateEmail(email);
    const isPwValid = validatePw(password);
    if (!isEmailValid || !isPwValid) return;

    setIsLoading(true);

    try {
      const data = await apiLogin(email, password);

      // Handle "remember me"
      if (rememberMe) {
        localStorage.setItem("hrs_remember", email);
      } else {
        localStorage.removeItem("hrs_remember");
      }

      // Persist session
      saveSession(data.access, data.refresh, data.user);

      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setIsLoading(false);
      setAlertMsg(err.message || "Invalid email or password. Please try again.");
      setPassword("");
      setPwErr("");
      setShake(true);
      setTimeout(() => setShake(false), 350);
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
          <div className="welcome-txt" style={{ fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,.95)', marginBottom: 20, letterSpacing: '.02em' }}>Welcome to</div>

          <div className="brand-logo-wrap" style={{ width: 88, height: 88, background: 'var(--active)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 28px rgba(0,0,0,.28)' }}>
            <i className="fa-solid fa-users" style={{ fontSize: 38, color: 'var(--accent1)' }}></i>
          </div>

          <div className="brand-name" style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-.3px', lineHeight: 1.2, marginBottom: 4 }}>HRS Management System</div>
          <div className="brand-tagline-small" style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 28 }}>Human Resource System</div>
          <div className="brand-divider" style={{ width: 44, height: 3, background: 'rgba(255,255,255,.35)', borderRadius: 2, margin: '0 auto 26px' }}></div>
          <p className="brand-tagline" style={{ fontSize: 13.5, fontWeight: 400, color: 'rgba(255,255,255,.72)', lineHeight: 1.7, maxWidth: 230, margin: '0 auto' }}>
            Manage employees, attendance, and payroll efficiently in one place.
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
        <div className="deco-circle dc-2" style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', width: 140, height: 140, background: 'rgba(249,115,22,.05)', bottom: 100, right: 60 }}></div>

        <div className="login-card" style={{ width: '100%', maxWidth: 380, zIndex: 2, transform: shake ? 'translateX(5px)' : 'none', transition: 'transform 0.1s' }}>
          <p className="card-role" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--text-dark)', textAlign: 'center', marginBottom: 4, lineHeight: 1.1 }}>Admin</p>
          <p className="card-sub" style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 14, textAlign: 'center' }}>Sign in to your HRS account to continue.</p>

          {/* Alert */}
          {alertMsg && (
            <div className="alert alert-error show" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 18, lineHeight: 1.45, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}></i>
              <span>{alertMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 7 }}>Email / Username</label>
              <div className="input-wrap" style={{ position: 'relative' }}>
                <i className="fa-solid fa-envelope input-icon" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-soft)', pointerEvents: 'none' }}></i>
                <input
                  id="login-email"
                  className={`form-input ${emailErr ? 'is-error' : ''}`}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); setAlertMsg(""); }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  placeholder="admin@example.com"
                  style={{ width: '100%', height: 47, padding: '0 42px 0 40px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, fontFamily: 'Inter', color: 'var(--text-dark)', background: 'var(--bg)', outline: 'none' }}
                />
              </div>
              {emailErr && (
                <div className="field-err show" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500, color: '#ef4444', marginTop: 5 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 10 }}></i>
                  <span>{emailErr}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 7 }}>Password</label>
              <div className="input-wrap" style={{ position: 'relative' }}>
                <i className="fa-solid fa-lock input-icon" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-soft)', pointerEvents: 'none' }}></i>
                <input
                  id="login-password"
                  className={`form-input ${pwErr ? 'is-error' : ''}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (pwErr) validatePw(e.target.value); setAlertMsg(""); }}
                  onBlur={(e) => validatePw(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ width: '100%', height: 47, padding: '0 42px 0 40px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, fontFamily: 'Inter', color: 'var(--text-dark)', background: 'var(--bg)', outline: 'none' }}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-soft)', fontSize: 14, padding: 5, borderRadius: 6 }}>
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {pwErr && (
                <div className="field-err show" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500, color: '#ef4444', marginTop: 5 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 10 }}></i>
                  <span>{pwErr}</span>
                </div>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="form-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 24px', gap: 8, flexWrap: 'wrap' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ display: 'none' }} />
                <span className="custom-cb" style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${rememberMe ? 'var(--accent1)' : 'var(--border)'}`, background: rememberMe ? 'var(--accent1)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-check" style={{ fontSize: 9, color: '#fff', opacity: rememberMe ? 1 : 0 }}></i>
                </span>
                <span className="cb-text" style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>Remember Me</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent1)', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={isLoading || isSuccess}
              style={{ width: '100%', height: 47, background: isSuccess ? '#16a34a' : 'var(--active)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: (isLoading || isSuccess) ? 'not-allowed' : 'pointer', letterSpacing: '.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (isLoading || isSuccess) ? 0.65 : 1 }}
            >
              {isLoading && (
                <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.28)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }}></div>
              )}
              {isSuccess && <i className="fa-solid fa-circle-check"></i>}
              {!isLoading && !isSuccess && <span>Log In</span>}
              {isLoading && <span>Signing in…</span>}
              {isSuccess && <span>Access Granted…</span>}
            </button>
          </form>

          <p className="hint-txt" style={{ marginTop: 14, fontSize: 11, color: 'var(--text-soft)', textAlign: 'center' }}>*Do not share your login credentials with anyone.</p>
        </div>
      </div>
    </div>
  );
}
