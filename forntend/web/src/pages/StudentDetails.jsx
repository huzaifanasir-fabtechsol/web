import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStudent, getStudentEnrollments } from "../api/courseStudentApi";

const STATUS_PILL = {
  active: "pill-blue",
  passed: "pill-orange",
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsError, setEnrollmentsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      if (!accessToken || !id) return;
      setLoading(true);
      setError("");
      setEnrollmentsError("");
      try {
        const [studentData, enrollmentData] = await Promise.all([
          getStudent(accessToken, id),
          getStudentEnrollments(accessToken, id).catch((err) => {
            setEnrollmentsError(err.message || "Failed to load enrolled courses.");
            return { results: [] };
          }),
        ]);
        setStudent(studentData);
        setEnrollments(enrollmentData?.results || []);
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
          <span className={`pill ${student.is_active ? "pill-green" : "pill-red"}`} style={{ fontSize: 13, padding: "6px 14px" }}>
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

      {/* Enrolled Courses */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon icon-green">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h4 className="card-title">Enrolled Courses</h4>
              <span className="card-sub">
                {enrollments.length
                  ? `${enrollments.length} course${enrollments.length === 1 ? "" : "s"} on record`
                  : "Courses this student is enrolled in"}
              </span>
            </div>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {enrollmentsError ? (
            <div className="alert alert-error" style={{ margin: 16 }}>
              <i className="fa-solid fa-circle-exclamation"></i> {enrollmentsError}
            </div>
          ) : enrollments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--text-soft)" }}>
              <i className="fa-solid fa-book-open" style={{ fontSize: 28, marginBottom: 10, opacity: 0.5 }}></i>
              <p>This student isn't enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <strong style={{ color: "var(--text-dark)" }}>{e.course_name}</strong>
                        {e.duration_months ? (
                          <span style={{ display: "block", fontSize: 12, color: "var(--text-soft)" }}>
                            {e.duration_months} month{e.duration_months === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </td>
                      <td>{formatDate(e.start_date)}</td>
                      <td>{formatDate(e.end_date)}</td>
                      <td>
                        <span className={`pill ${STATUS_PILL[e.status] || "pill-gray"}`} style={{ fontSize: 11.5 }}>
                          {e.status_display || e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
