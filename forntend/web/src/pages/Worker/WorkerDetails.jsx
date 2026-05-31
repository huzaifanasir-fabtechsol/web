import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getWorker } from "../../api/workerApi";

export default function WorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      if (!accessToken || !id) return;
      setLoading(true);
      setError("");
      try {
        const data = await getWorker(accessToken, id);
        setWorker(data);
      } catch (err) {
        setError(err.message || "Failed to load worker details.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "var(--text-soft)" }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: 12, color: "var(--active)" }}></i>
          <p>Loading worker details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
        <button className="btn btn-outline" onClick={() => navigate("/workers/list")}>
          <i className="fa-solid fa-arrow-left"></i> Back to Worker Directory
        </button>
      </div>
    );
  }

  if (!worker) return null;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="act-btn" onClick={() => navigate("/workers/list")} title="Back" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-arrow-left" style={{ color: "var(--text-mid)" }}></i>
            </button>
            <div>
              <h2>Employee Profile</h2>
              <p>Employment role, monthly salary scale and registration details.</p>
            </div>
          </div>
        </div>
        <div>
          <span className="pill pill-blue" style={{ fontSize: 13, padding: "6px 14px" }}>
            {worker.job_role}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Profile Card left */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-body" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div className="upload-preview" style={{ width: 120, height: 120, border: "4px solid var(--border)", boxShadow: "var(--shadow)" }}>
                {worker.profile_photo ? (
                  <img src={worker.profile_photo} alt={worker.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}&size=120&background=random`} alt={worker.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                )}
              </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>{worker.name}</h3>
            <p style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
              Hired {worker.hire_date}
            </p>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Job Role</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{worker.job_role}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Monthly Salary</span>
                <strong style={{ fontSize: 13, color: "var(--accent2)" }}>Rs. {Number(worker.salary).toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Gender</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{worker.gender}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Panels right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Personal & Contract Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-blue">
                  <i className="fa-solid fa-address-card"></i>
                </div>
                <div>
                  <h4 className="card-title">Employee Details</h4>
                  <span className="card-sub">Identity and personal registration details</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>CNIC Number</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{worker.cnic}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Email Address</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)", wordBreak: "break-all" }}>{worker.email}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Date of Birth</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{worker.date_of_birth}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Hire Date</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{worker.hire_date}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
