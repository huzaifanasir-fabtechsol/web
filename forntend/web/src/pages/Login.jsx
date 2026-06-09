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

  const validateEmail = (val) => {
    if (!val) { setEmailErr("This field is required."); return false; }
    setEmailErr(""); return true;
  };

  const validatePw = (val) => {
    if (!val) { setPwErr("This field is required."); return false; }
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
        }

        .form-new {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .input-group-new {
          margin-bottom: 20px;
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

        .pw-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          font-size: 14px;
          padding: 4px;
        }

        .pw-toggle:hover {
          color: #64748b;
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

        .form-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          margin-bottom: 24px;
          width: 100%;
        }

        .remember-me-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .remember-checkbox-custom {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 1.5px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: #ffffff;
          box-sizing: border-box;
        }

        .remember-checkbox-custom.checked {
          background-color: #002F24;
          border-color: #002F24;
        }

        .remember-checkbox-custom i {
          font-size: 10px;
          color: #ffffff;
        }

        .remember-me-text {
          font-size: 13.5px;
          color: #475569;
          font-weight: 500;
        }

        .forgot-password-link {
          font-size: 13.5px;
          font-weight: 600;
          color: #002F24;
          text-decoration: underline;
          transition: opacity 0.2s;
        }

        .forgot-password-link:hover {
          opacity: 0.8;
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
          margin-bottom: 22px;
        }

        .btn-signin:hover {
          background-color: #004838;
        }

        .btn-signin:disabled {
          background-color: #94a3b8;
          cursor: not-allowed;
        }

        .btn-signin i {
          font-size: 13px;
          transition: transform 0.2s ease;
        }

        .btn-signin:hover:not(:disabled) i {
          transform: translateX(3px);
        }

        .or-divider {
          display: flex;
          align-items: center;
          width: 100%;
          margin-bottom: 22px;
        }

        .or-line {
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }

        .or-text {
          padding: 0 16px;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .btn-google {
          width: 100%;
          height: 52px;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: background-color 0.2s;
          margin-bottom: 28px;
        }

        .btn-google:hover {
          background-color: #f8fafc;
        }

        .google-icon {
          width: 18px;
          height: 18px;
        }

        .signup-prompt {
          font-size: 13.5px;
          color: #64748b;
          text-align: center;
        }

        .signup-link {
          font-weight: 700;
          color: #002F24;
          text-decoration: none;
          margin-left: 4px;
        }

        .signup-link:hover {
          text-decoration: underline;
        }

        .shake {
          animation: shakeKey 0.3s;
        }

        @keyframes shakeKey {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
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
          {/* <div className="info-horse-svg">
            <svg viewBox="0 0 120 120" fill="none" stroke="#002F24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> */}
          {/* Stylized horse outline facing left */}
          {/* <path d="M75,95 C75,80 78,55 70,40 C66,32 58,25 58,18 C58,15 62,12 65,15 C68,18 70,25 70,30" />
              <path d="M58,18 C54,14 48,15 48,22 C48,25 50,30 52,32" />
              <path d="M53,24 C50,20 44,21 44,28 C44,31 46,36 48,38" />
              <path d="M52,32 C48,35 40,40 38,48 C36,55 35,62 30,68 C26,72 20,74 24,78 C28,82 35,80 39,76 C43,72 45,65 48,60" />
              <path d="M48,60 C50,65 52,70 56,73 C60,76 66,75 70,70 M30,68 L32,71" />
              <path d="M 32,88 C 50,95 70,95 88,88" stroke="#C5A880" strokeWidth="1.8" />
            </svg>
          </div> */}

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

      {/* Right panel: Login card form */}
      <div className="login-form-section">
        <div className={`login-card-new ${shake ? 'shake' : ''}`}>

          {/* School logo */}
          <div className="school-logo-container">
            <img src="/logo.png" alt="Horse Riding School Logo" className="school-logo" />
          </div>

          <h2 className="welcome-title">Welcome Back</h2>
          <p className="welcome-subtitle">Sign in to continue to your account</p>

          {/* General alert error messages */}
          {alertMsg && (
            <div style={{ width: '100%', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#ef4444', fontSize: 13.5, marginBottom: 20, boxSizing: 'border-box', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{alertMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="form-new" noValidate>

            {/* Email Address Input */}
            <div className="input-group-new">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="input-container-inner">
                <i className="fa-regular fa-envelope input-icon-left"></i>
                <input
                  id="login-email"
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

            {/* Password Input */}
            <div className="input-group-new">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-container-inner">
                <i className="fa-solid fa-lock input-icon-left"></i>
                <input
                  id="login-password"
                  className={`input-new ${pwErr ? 'is-error' : ''}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (pwErr) validatePw(e.target.value); setAlertMsg(""); }}
                  onBlur={(e) => validatePw(e.target.value)}
                  placeholder="••••••••••••"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {pwErr && (
                <div className="error-message">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {pwErr}
                </div>
              )}
            </div>

            {/* Checkbox and Forgot Password link */}
            <div className="form-actions-row">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span className={`remember-checkbox-custom ${rememberMe ? 'checked' : ''}`}>
                  {rememberMe && <i className="fa-solid fa-check"></i>}
                </span>
                <span className="remember-me-text">Remember me</span>
              </label>

              <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit"
              className="btn-signin"
              disabled={isLoading || isSuccess}
            >
              {isLoading && (
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.28)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }}></div>
              )}
              <span>{isSuccess ? 'Access Granted...' : (isLoading ? 'Logging in...' : 'Sign In')}</span>
              {!isLoading && !isSuccess && <i className="fa-solid fa-arrow-right"></i>}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
