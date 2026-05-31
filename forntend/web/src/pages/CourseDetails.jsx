import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCourse } from "../api/courseStudentApi";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    async function fetchDetails() {
      if (!accessToken || !id) return;
      setLoading(true);
      setError("");
      try {
        const data = await getCourse(accessToken, id);
        setCourse(data);
      } catch (err) {
        setError(err.message || "Failed to load course details.");
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
          <p>Loading course details…</p>
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
        <button className="btn btn-outline" onClick={() => navigate("/courses")}>
          <i className="fa-solid fa-arrow-left"></i> Back to Courses
        </button>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="act-btn" onClick={() => navigate("/courses")} title="Back" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-arrow-left" style={{ color: "var(--text-mid)" }}></i>
            </button>
            <div>
              <h2>Course Details</h2>
              <p>Riding program structure, tuition fee and schedules.</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13 }}
            onClick={() => navigate(`/courses/${course.id}/enrollment`)}
          >
            <i className="fa-solid fa-user-group" /> Manage Enrollment
          </button>
          <span className="pill pill-purple" style={{ fontSize: 13, padding: "6px 14px" }}>
            <i className="fa-solid fa-graduation-cap"></i> Program Active
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Core Stats Card left */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-body" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
            <div className="card-icon icon-purple" style={{ width: 80, height: 80, fontSize: 32, borderRadius: "50%", margin: "0 auto 20px" }}>
              <i className="fa-solid fa-book-open"></i>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>{course.name}</h3>
            <p style={{ fontSize: 13, color: "var(--text-soft)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 24 }}>
              Duration: {course.duration_months} Month{course.duration_months !== 1 ? "s" : ""}
            </p>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, textAlign: "left" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600 }}>Enrollment Tuition Fee</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "var(--active)" }}>
                  Rs. {Number(course.fee).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Panels right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Class Schedule & Timing Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-blue">
                  <i className="fa-regular fa-clock"></i>
                </div>
                <div>
                  <h4 className="card-title">Class Time & Schedule</h4>
                  <span className="card-sub">Daily batch timings and day slots</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>Daily Class Time</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--bg)", borderRadius: 10 }}>
                    <i className="fa-regular fa-clock" style={{ color: "#3b82f6" }}></i>
                    <strong style={{ fontSize: 15, color: "var(--text-dark)" }}>{course.class_time}</strong>
                  </div>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 12 }}>Active Class Days</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {WEEKDAYS.map((day) => {
                      const isActive = (course.class_days || []).includes(day);
                      return (
                        <div
                          key={day}
                          className={`day-chip ${isActive ? "day-chip-active" : ""}`}
                          style={{
                            cursor: "default",
                            pointerEvents: "none",
                            opacity: isActive ? 1 : 0.45,
                            transform: "none"
                          }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Enrolled Students Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-left">
                  <div className="card-icon icon-green">
                    <i className="fa-solid fa-user-group"></i>
                  </div>
                  <div>
                    <h4 className="card-title">Student Enrollment</h4>
                    <span className="card-sub">Students actively enrolled in this course</span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "var(--active)" }}>
                      {course.enrolled_count ?? 0}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 4 }}>Students Enrolled</div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12 }}
                    onClick={() => navigate(`/courses/${course.id}/enrollment`)}
                  >
                    <i className="fa-solid fa-arrow-right" /> Manage Enrollment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
