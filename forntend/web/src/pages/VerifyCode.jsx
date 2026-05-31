import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function VerifyCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.join("").length < 6) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    navigate('/reset-password');
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
            <i className="fa-solid fa-shield-halved" style={{ fontSize: 38, color: 'var(--accent1)' }}></i>
          </div>
          <div className="brand-name" style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-.3px', lineHeight: 1.2, marginBottom: 4 }}>Verify Identity</div>
          <p className="brand-tagline" style={{ fontSize: 13.5, fontWeight: 400, color: 'rgba(255,255,255,.72)', lineHeight: 1.7, maxWidth: 260, margin: '16px auto 0' }}>
            We've sent a secure 6-digit verification code to your registered email address.
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
          <p className="card-role" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--text-dark)', marginBottom: 8, lineHeight: 1.1 }}>Verify Code</p>
          <p className="card-sub" style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 24 }}>Enter the 6-digit code we sent to your email.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => inputs.current[i] = el}
                  type="text"
                  maxLength="1"
                  value={c}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  style={{ width: 44, height: 50, textAlign: 'center', fontSize: 20, fontWeight: 700, border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none' }}
                />
              ))}
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', height: 47, background: 'var(--active)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isLoading ? 0.65 : 1 }}>
              {isLoading && <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.28)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }}></div>}
              {!isLoading && <span>Verify & Proceed</span>}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-soft)' }}>
              Didn't receive a code? <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent1)', fontWeight: 600, cursor: 'pointer' }}>Resend</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
