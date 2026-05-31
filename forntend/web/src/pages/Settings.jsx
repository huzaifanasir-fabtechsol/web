import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getSystemSettings, updateSystemSettings, changePassword } from "../api/settingsApi";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }) {
  const icons = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };
  return (
    <div className={`toast ${type} ${visible ? "show" : ""}`}>
      <i className={`fa-solid ${icons[type] || icons.info}`}></i>
      {message}
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonField({ wide }) {
  return (
    <div className="form-group" style={wide ? { gridColumn: "1 / -1" } : {}}>
      <div style={{ height: 13, width: "40%", background: "#e5e7eb", borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 38, background: "#f3f4f6", borderRadius: 9 }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { accessToken } = useAuth();

  // ── State ──
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  // System settings form
  const [form, setForm] = useState({
    school_name: "",
    contact_email: "",
    contact_phone: "",
    tax_vat_id: "",
    business_address: "",
    smtp_host: "",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    default_from_email: "",
  });

  // Logo state
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const fileInputRef = useRef(null);

  // Change password form
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwErrors, setPwErrors] = useState({});

  // Form field errors
  const [formErrors, setFormErrors] = useState({});

  // ── Helpers ──
  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  // ── Load settings on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSystemSettings(accessToken);
        setForm({
          school_name: data.school_name || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          tax_vat_id: data.tax_vat_id || "",
          business_address: data.business_address || "",
          smtp_host: data.smtp_host || "",
          smtp_port: data.smtp_port || "",
          smtp_username: data.smtp_username || "",
          smtp_password: "", // always blank (write-only on backend)
          default_from_email: data.default_from_email || "",
        });
        if (data.profile_picture_url) {
          setLogoPreview(data.profile_picture_url);
        }
      } catch (err) {
        showToast(err.message || "Failed to load settings.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  // ── Handlers ──
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleLogoClick = () => fileInputRef.current?.click();

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB.", "error");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!form.school_name.trim()) errors.school_name = "School name is required.";
    if (!form.contact_email.trim()) errors.contact_email = "Contact email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) errors.contact_email = "Enter a valid email.";
    if (form.smtp_port && (isNaN(Number(form.smtp_port)) || Number(form.smtp_port) < 1 || Number(form.smtp_port) > 65535)) {
      errors.smtp_port = "Port must be between 1 and 65535.";
    }
    if (form.default_from_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.default_from_email)) {
      errors.default_from_email = "Enter a valid email.";
    }
    return errors;
  };

  const handleSaveSettings = async () => {
    const errors = validateProfileForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        // Only send smtp_password if the user typed something
        if (key === "smtp_password" && !val) return;
        if (val !== undefined && val !== null) payload.append(key, val);
      });
      if (logoFile) payload.append("profile_picture", logoFile);

      await updateSystemSettings(accessToken, payload);
      setLogoFile(null); // clear file selection after save
      showToast("Settings saved successfully.", "success");
    } catch (err) {
      showToast(err.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
    if (pwErrors[name]) setPwErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validatePwForm = () => {
    const errors = {};
    if (!pwForm.current_password) errors.current_password = "Current password is required.";
    if (!pwForm.new_password) errors.new_password = "New password is required.";
    else if (pwForm.new_password.length < 8) errors.new_password = "Password must be at least 8 characters.";
    if (!pwForm.confirm_password) errors.confirm_password = "Please confirm your new password.";
    else if (pwForm.new_password !== pwForm.confirm_password) errors.confirm_password = "Passwords do not match.";
    return errors;
  };

  const handleChangePassword = async () => {
    const errors = validatePwForm();
    if (Object.keys(errors).length) {
      setPwErrors(errors);
      return;
    }
    setChangingPw(true);
    try {
      await changePassword(accessToken, pwForm);
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwErrors({});
      showToast("Password changed successfully.", "success");
    } catch (err) {
      showToast(err.message || "Failed to change password.", "error");
    } finally {
      setChangingPw(false);
    }
  };

  // ── Render ──
  return (
    <div className="content">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>System Settings</h2>
          <p>Configure your riding school application preferences.</p>
        </div>
        {activeTab === "profile" && (
          <button
            className="btn btn-primary"
            onClick={handleSaveSettings}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Saving…
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i> Save Settings
              </>
            )}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
        {/* Sidebar Navigation */}
        <div className="card" style={{ padding: "10px", marginBottom: 0 }}>
          <div
            className={`nav-item${activeTab === "profile" ? " active" : ""}`}
            style={{ marginBottom: 4 }}
            onClick={() => setActiveTab("profile")}
          >
            <i className="fa-solid fa-building"></i> School Profile
          </div>
          <div
            className={`nav-item${activeTab === "security" ? " active" : ""}`}
            style={{ marginBottom: 4 }}
            onClick={() => setActiveTab("security")}
          >
            <i className="fa-solid fa-lock"></i> Security
          </div>
        </div>

        {/* Content Panel */}
        <div>
          {/* ── School Profile Tab ── */}
          {activeTab === "profile" && (
            <>
              {/* Logo Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">
                    <div className="card-icon icon-blue">
                      <i className="fa-solid fa-building"></i>
                    </div>
                    <div>
                      <div className="card-title">School Profile</div>
                      <div className="card-sub">Update your business information and branding</div>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  {/* Logo Upload */}
                  <div
                    className="upload-zone"
                    style={{ marginBottom: 28, cursor: "pointer" }}
                    onClick={handleLogoClick}
                  >
                    <div
                      className="upload-preview"
                      style={{
                        background: logoPreview ? "transparent" : "var(--active)",
                        borderRadius: 14,
                        overflow: "hidden",
                      }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="School Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <i className="fa-solid fa-horse" style={{ color: "#fff" }}></i>
                      )}
                    </div>
                    <div className="upload-info">
                      <h4>School Logo</h4>
                      <p>Appears on receipts and the sidebar. Click to change. Max 5 MB.</p>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleLogoClick(); }}
                      >
                        <i className="fa-solid fa-arrow-up-from-bracket"></i>{" "}
                        {logoFile ? "Change Again" : logoPreview ? "Change Logo" : "Upload Logo"}
                      </button>
                      {logoFile && (
                        <span style={{ fontSize: 11, color: "var(--text-soft)", marginLeft: 10 }}>
                          {logoFile.name}
                        </span>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoChange}
                    />
                  </div>

                  {/* School Info Fields */}
                  {loading ? (
                    <div className="form-grid">
                      <SkeletonField wide />
                      <SkeletonField />
                      <SkeletonField />
                      <SkeletonField />
                      <SkeletonField />
                      <SkeletonField wide />
                    </div>
                  ) : (
                    <div className="form-grid">
                      <div className="form-group col-full">
                        <label className="form-label">
                          School Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control${formErrors.school_name ? " is-invalid" : ""}`}
                          name="school_name"
                          value={form.school_name}
                          onChange={handleFormChange}
                          placeholder="e.g. EquiManage Riding School"
                        />
                        {formErrors.school_name && <span className="field-error">{formErrors.school_name}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Contact Email <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="email"
                          className={`form-control${formErrors.contact_email ? " is-invalid" : ""}`}
                          name="contact_email"
                          value={form.contact_email}
                          onChange={handleFormChange}
                          placeholder="contact@yourschool.com"
                        />
                        {formErrors.contact_email && <span className="field-error">{formErrors.contact_email}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Contact Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          name="contact_phone"
                          value={form.contact_phone}
                          onChange={handleFormChange}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tax / VAT ID</label>
                        <input
                          type="text"
                          className="form-control"
                          name="tax_vat_id"
                          value={form.tax_vat_id}
                          onChange={handleFormChange}
                          placeholder="TX-98765432"
                        />
                      </div>

                      <div className="form-group col-full">
                        <label className="form-label">Business Address</label>
                        <textarea
                          className="form-control"
                          name="business_address"
                          rows={3}
                          value={form.business_address}
                          onChange={handleFormChange}
                          placeholder="123 Equestrian Lane, Countryside, State 12345"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SMTP Configuration Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">
                    <div className="card-icon icon-teal">
                      <i className="fa-solid fa-envelope-open-text"></i>
                    </div>
                    <div>
                      <div className="card-title">Email / SMTP Configuration</div>
                      <div className="card-sub">Used for password resets and all outgoing emails</div>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  {loading ? (
                    <div className="form-grid">
                      <SkeletonField />
                      <SkeletonField />
                      <SkeletonField />
                      <SkeletonField />
                      <SkeletonField />
                    </div>
                  ) : (
                    <div className="form-grid">
                      <div className="form-group span-2">
                        <label className="form-label">SMTP Host</label>
                        <input
                          type="text"
                          className="form-control"
                          name="smtp_host"
                          value={form.smtp_host}
                          onChange={handleFormChange}
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">SMTP Port</label>
                        <input
                          type="number"
                          className={`form-control${formErrors.smtp_port ? " is-invalid" : ""}`}
                          name="smtp_port"
                          value={form.smtp_port}
                          onChange={handleFormChange}
                          placeholder="587"
                          min={1}
                          max={65535}
                        />
                        {formErrors.smtp_port && <span className="field-error">{formErrors.smtp_port}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">SMTP Username</label>
                        <input
                          type="text"
                          className="form-control"
                          name="smtp_username"
                          value={form.smtp_username}
                          onChange={handleFormChange}
                          placeholder="your@gmail.com"
                          autoComplete="off"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          SMTP Password{" "}
                          <span style={{ fontSize: 10.5, color: "var(--text-soft)", fontWeight: 400 }}>
                            (leave blank to keep existing)
                          </span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="smtp_password"
                          value={form.smtp_password}
                          onChange={handleFormChange}
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Default From Email</label>
                        <input
                          type="email"
                          className={`form-control${formErrors.default_from_email ? " is-invalid" : ""}`}
                          name="default_from_email"
                          value={form.default_from_email}
                          onChange={handleFormChange}
                          placeholder="noreply@yourschool.com"
                        />
                        {formErrors.default_from_email && (
                          <span className="field-error">{formErrors.default_from_email}</span>
                        )}
                      </div>

                      {/* SMTP info note */}
                      <div
                        className="col-full"
                        style={{
                          gridColumn: "1 / -1",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 10,
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 9,
                        }}
                      >
                        <i className="fa-solid fa-circle-info" style={{ color: "#3b82f6", marginTop: 1, flexShrink: 0 }}></i>
                        <p style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.5 }}>
                          SMTP settings are applied immediately to all outgoing emails. Port 587 uses STARTTLS, port 465 uses SSL.
                          The password is securely stored and never returned to the browser.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Security Tab ── */}
          {activeTab === "security" && (
            <div className="card">
              <div className="card-header">
                <div className="card-header-left">
                  <div className="card-icon icon-purple">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <div>
                    <div className="card-title">Change Password</div>
                    <div className="card-sub">Update your account password</div>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div
                  style={{
                    maxWidth: 480,
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                  }}
                >
                  {/* Current Password */}
                  <div className="form-group">
                    <label className="form-label">
                      Current Password <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control${pwErrors.current_password ? " is-invalid" : ""}`}
                      name="current_password"
                      value={pwForm.current_password}
                      onChange={handlePwChange}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                    />
                    {pwErrors.current_password && (
                      <span className="field-error">{pwErrors.current_password}</span>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "var(--border)" }} />

                  {/* New Password */}
                  <div className="form-group">
                    <label className="form-label">
                      New Password <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control${pwErrors.new_password ? " is-invalid" : ""}`}
                      name="new_password"
                      value={pwForm.new_password}
                      onChange={handlePwChange}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    {pwErrors.new_password && (
                      <span className="field-error">{pwErrors.new_password}</span>
                    )}

                    {/* Password strength indicator */}
                    {pwForm.new_password && (
                      <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                        {[...Array(4)].map((_, i) => {
                          const strength = Math.min(
                            Math.floor(
                              (pwForm.new_password.length >= 8 ? 1 : 0) +
                              (/[A-Z]/.test(pwForm.new_password) ? 1 : 0) +
                              (/[0-9]/.test(pwForm.new_password) ? 1 : 0) +
                              (/[^A-Za-z0-9]/.test(pwForm.new_password) ? 1 : 0)
                            ),
                            4
                          );
                          const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
                          return (
                            <div
                              key={i}
                              style={{
                                flex: 1, height: 4, borderRadius: 4,
                                background: i < strength ? colors[strength - 1] : "var(--border)",
                                transition: "background 0.3s",
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label className="form-label">
                      Confirm New Password <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control${pwErrors.confirm_password ? " is-invalid" : ""}`}
                      name="confirm_password"
                      value={pwForm.confirm_password}
                      onChange={handlePwChange}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                    />
                    {pwErrors.confirm_password && (
                      <span className="field-error">{pwErrors.confirm_password}</span>
                    )}
                    {/* Match indicator */}
                    {pwForm.confirm_password && pwForm.new_password && (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          color: pwForm.new_password === pwForm.confirm_password ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {pwForm.new_password === pwForm.confirm_password ? (
                          <><i className="fa-solid fa-check" style={{ marginRight: 4 }} />Passwords match</>
                        ) : (
                          <><i className="fa-solid fa-xmark" style={{ marginRight: 4 }} />Passwords do not match</>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="form-actions" style={{ paddingTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setPwForm({ current_password: "", new_password: "", confirm_password: "" });
                        setPwErrors({});
                      }}
                      disabled={changingPw}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleChangePassword}
                      disabled={changingPw}
                    >
                      {changingPw ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> Changing…</>
                      ) : (
                        <><i className="fa-solid fa-key"></i> Change Password</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
