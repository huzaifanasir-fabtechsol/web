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
          margin-bottom: 25px;
          display: block;
        }

        .link-forgot-new:hover {
          text-decoration: underline;
        }

        .register-text-new {
          font-size: 12.5px;
          color: #555555;
          text-align: center;
          line-height: 1.5;
          margin-bottom: 30px;
          border-top: 1px solid #eeeeee;
          padding-top: 20px;
          width: 100%;
        }

        .register-link-new {
          color: #5191c1;
          text-decoration: none;
          font-weight: 600;
        }

        .register-link-new:hover {
          text-decoration: underline;
        }

        .connect-header-new {
          font-size: 11px;
          font-weight: 700;
          color: #34495e;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
          width: 100%;
        }

        .social-row-new {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 35px;
          width: 100%;
        }

        .social-circle-new {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #3b5998; /* Facebook default */
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 14px;
          text-decoration: none;
          transition: transform 0.2s, opacity 0.2s;
        }

        .social-circle-new:hover {
          transform: scale(1.1);
          opacity: 0.9;
        }

        .social-circle-new.fb { background-color: #3b5998; }
        .social-circle-new.tw { background-color: #1da1f2; }
        .social-circle-new.ln { background-color: #0077b5; }
        .social-circle-new.ig { background-color: #e1306c; }

        .app-downloads-new {
          display: flex;
          justify-content: center;
          gap: 10px;
          width: 100%;
          border-top: 1px solid #eeeeee;
          padding-top: 25px;
        }

        .app-btn-new {
          display: flex;
          align-items: center;
          background-color: #111111;
          color: #ffffff;
          border-radius: 4px;
          padding: 6px 14px;
          text-decoration: none;
          min-width: 115px;
          box-sizing: border-box;
          transition: background-color 0.2s;
        }

        .app-btn-new:hover {
          background-color: #2a2a2a;
        }

        .app-icon-new {
          font-size: 20px;
          margin-right: 8px;
        }

        .app-btn-text-new {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .app-sub-text-new {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #aaaaaa;
        }

        .app-main-text-new {
          font-size: 11px;
          font-weight: 700;
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

      <div className={`login-card-new ${shake ? 'shake' : ''}`}>
        
        {/* Logo */}
        <div className="login-logo-container">
          <div className="logo-symbol">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="logo-text">
            HRS<span className="logo-dot">.</span>
          </div>
        </div>

        <div className="login-title-new">User Login</div>

        {/* General Alert */}
        {alertMsg && (
          <div style={{ width: '100%', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#b91c1c', fontSize: 13, marginBottom: 15, boxSizing: 'border-box' }}>
            {alertMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="form-new" noValidate>
          {/* Email / Username */}
          <div className="input-group-new">
            <input
              id="login-email"
              className={`input-new ${emailErr ? 'is-error' : ''}`}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); setAlertMsg(""); }}
              onBlur={(e) => validateEmail(e.target.value)}
              placeholder="Username / Email Address"
            />
            {emailErr && (
              <div className="error-badge">
                {emailErr}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="input-group-new" style={{ marginBottom: 15 }}>
            <input
              id="login-password"
              className={`input-new ${pwErr ? 'is-error' : ''}`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (pwErr) validatePw(e.target.value); setAlertMsg(""); }}
              onBlur={(e) => validatePw(e.target.value)}
              placeholder="Password"
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7f8c8d', fontSize: 14, padding: 5, borderRadius: 6 }}>
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
            {pwErr && (
              <div className="error-badge">
                {pwErr}
              </div>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, width: '100%' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ display: 'none' }} />
              <span style={{ width: 17, height: 17, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${rememberMe ? '#5191c1' : '#d1d5db'}`, background: rememberMe ? '#5191c1' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <i className="fa-solid fa-check" style={{ fontSize: 9, color: '#fff', opacity: rememberMe ? 1 : 0 }}></i>
              </span>
              <span style={{ fontSize: 13, color: '#555555', fontWeight: 500 }}>Remember Me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit"
            className="btn-submit-new"
            disabled={isLoading || isSuccess}
          >
            {isLoading && (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.28)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }}></div>
            )}
            {isSuccess ? 'Access Granted...' : (isLoading ? 'Logging in...' : 'Login')}
          </button>
        </form>

        {/* Forgot Password */}
        <Link to="/forgot-password" className="link-forgot-new">Forgot Password?</Link>

        {/* Register Text */}
        <div className="register-text-new">
          To register your interest in HRS, <a href="#" className="register-link-new">click here to fill in our enquiry form</a>
        </div>

        {/* Connect Header */}
        <div className="connect-header-new">Connect with HRS</div>

        {/* Social Row */}
        <div className="social-row-new">
          <a href="#" className="social-circle-new fb"><i className="fa-brands fa-facebook-f"></i></a>
          <a href="#" className="social-circle-new tw"><i className="fa-brands fa-x-twitter"></i></a>
          <a href="#" className="social-circle-new ln"><i className="fa-brands fa-linkedin-in"></i></a>
          <a href="#" className="social-circle-new ig"><i className="fa-brands fa-instagram"></i></a>
        </div>

        {/* App Downloads */}
        <div className="app-downloads-new">
          <a href="#" className="app-btn-new">
            <i className="fa-brands fa-apple app-icon-new"></i>
            <div className="app-btn-text-new">
              <span className="app-sub-text-new">Download on the</span>
              <span className="app-main-text-new">App Store</span>
            </div>
          </a>
          <a href="#" className="app-btn-new">
            <i className="fa-brands fa-google-play app-icon-new" style={{ fontSize: 16 }}></i>
            <div className="app-btn-text-new">
              <span className="app-sub-text-new">Get it on</span>
              <span className="app-main-text-new">Google Play</span>
            </div>
          </a>
        </div>

      </div>
    </div>
  );
}
