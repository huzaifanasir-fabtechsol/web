import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStudent } from "../api/courseStudentApi";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      if (!accessToken || !id) return;
      setLoading(true);
      setError("");
      try {
        const data = await getStudent(accessToken, id);
        setStudent(data);
      } catch (err) {
        setError(err.message || "Failed to load student details.");
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
          <p>Loading student details…</p>
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
        <button className="btn btn-outline" onClick={() => navigate("/students")}>
          <i className="fa-solid fa-arrow-left"></i> Back to Students
        </button>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="act-btn" onClick={() => navigate("/students")} title="Back" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-arrow-left" style={{ color: "var(--text-mid)" }}></i>
            </button>
            <div>
              <h2>Student Profile</h2>
              <p>Detailed overview of {student.name}'s membership and records.</p>
            </div>
          </div>
        </div>
        <div>
          <span className={`pill ${student.is_active ? "pill-green" : "pill-gray"}`} style={{ fontSize: 13, padding: "6px 14px" }}>
            {student.is_active ? "Active Student" : "Inactive Student"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Profile Card left */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-body" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div className="upload-preview" style={{ width: 120, height: 120, border: "4px solid var(--border)", boxShadow: "var(--shadow)" }}>
                {student.profile_picture ? (
                  <img src={student.profile_picture} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=120&background=random`} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                )}
              </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>{student.name}</h3>
            <p style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
              Joined {student.admission_date}
            </p>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Experience Level</span>
                <span className={`pill ${student.experience_level === "Advanced" ? "pill-purple" : student.experience_level === "Intermediate" ? "pill-orange" : "pill-blue"}`} style={{ fontSize: 11.5 }}>
                  {student.experience_level}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Age</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{student.age} Years</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Blood Group</span>
                <strong style={{ fontSize: 13, color: "var(--text-dark)" }}>{student.blood_group || "Not specified"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Panels right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Personal & Contact Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-blue">
                  <i className="fa-solid fa-address-card"></i>
                </div>
                <div>
                  <h4 className="card-title">Personal & Contact Details</h4>
                  <span className="card-sub">Identity and direct reachability info</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Phone Number</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{student.phone_number}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>National CNIC</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{student.cnic}</strong>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Residential Address</span>
                  <span style={{ fontSize: 14, color: "var(--text-dark)", lineHeight: 1.5 }}>{student.address || "No address on file."}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Info Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-orange">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <h4 className="card-title">Emergency & Guardian Information</h4>
                  <span className="card-sub">Next of kin records</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Guardian Name</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{student.guardian_name}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Relation</span>
                  <span className="pill pill-blue" style={{ fontSize: 11 }}>{student.guardian_relation || "Guardian"}</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Guardian Contact</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{student.guardian_contact}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>Guardian CNIC</span>
                  <strong style={{ fontSize: 14, color: "var(--text-dark)" }}>{student.guardian_cnic}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
