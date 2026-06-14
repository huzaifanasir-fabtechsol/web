import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { listStudents, getStudentEnrollments } from "../api/courseStudentApi";
import { getStudentAttendanceReport } from "../api/attendanceApi";

// ── Searchable Student Dropdown ──────────────────────────────────────────────
function SearchableStudentDropdown({ students, selectedId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedStudent = students.find(s => String(s.id) === String(selectedId));

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    `STU-${s.id.toString().padStart(3, "0")}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className="form-group" style={{ position: "relative", marginBottom: 0, flex: "1 1 240px" }}>
      <label className="form-label" style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", color: "var(--text-soft)", textTransform: "uppercase" }}>STUDENT</label>
      <div
        className="form-control"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: "#fff",
          height: 38,
          borderRadius: 9,
          padding: "0 12px",
          border: "1px solid var(--border)"
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: 13.5, color: selectedStudent ? "var(--text-dark)" : "var(--text-soft)" }}>
          {selectedStudent ? `${selectedStudent.name} (STU-${selectedStudent.id.toString().padStart(3, "0")})` : "— Select Student —"}
        </span>
        <i className={`fa-solid fa-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: 10, color: "var(--text-soft)" }} />
      </div>

      {isOpen && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: 6,
            padding: 8,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
            maxHeight: 280,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--border)"
          }}
        >
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type="text"
              className="form-control"
              style={{ height: 34, paddingLeft: 30, fontSize: 12.5 }}
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 10, top: 10, fontSize: 11, color: "var(--text-soft)" }} />
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "8px 12px", color: "var(--text-soft)", fontSize: 12.5, textAlign: "center" }}>
                No students found
              </div>
            ) : (
              filtered.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    background: String(selectedId) === String(s.id) ? "#eff6ff" : "transparent",
                    color: String(selectedId) === String(s.id) ? "#1e40af" : "var(--text-dark)",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (String(selectedId) !== String(s.id)) e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    if (String(selectedId) !== String(s.id)) e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => {
                    onChange(s.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-soft)" }}>STU-{s.id.toString().padStart(3, "0")}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function StudentAttendanceReport() {
  const { accessToken: token } = useAuth();

  // Selection states
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Report results
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Load students for filter on mount
  useEffect(() => {
    listStudents(token, { page_size: 200, is_active: true })
      .then((r) => {
        setStudents(r.results || []);
      })
      .catch(() => setErrorMsg("Failed to load students filter."))
      .finally(() => setLoadingStudents(false));
  }, [token]);

  // Load enrolled courses when student changes
  useEffect(() => {
    if (!selectedStudent) {
      setCourses([]);
      setSelectedCourse("");
      return;
    }
    setLoadingCourses(true);
    getStudentEnrollments(token, selectedStudent)
      .then((r) => {
        const list = r.results || [];
        setCourses(list);
        if (list.length > 0) {
          // Pre-select first active enrollment if available, else first item
          const activeItem = list.find(item => item.status === "active") || list[0];
          setSelectedCourse(activeItem.course);
        } else {
          setSelectedCourse("");
        }
      })
      .catch(() => {
        setErrorMsg("Failed to load enrolled courses.");
      })
      .finally(() => {
        setLoadingCourses(false);
      });
  }, [token, selectedStudent]);

  const handleGenerate = async () => {
    if (!selectedStudent) {
      setErrorMsg("Please select a student.");
      return;
    }
    if (!selectedCourse) {
      setErrorMsg("Please select an enrolled course.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await getStudentAttendanceReport(token, selectedStudent, selectedCourse, month, year);
      setReport(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to generate report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  function getInitials(name = "") {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  // Get bubble style classes based on status
  const getBubbleStyle = (status) => {
    switch (status) {
      case "present":
        return {
          background: "#eafaf1",
          color: "#16a34a",
          border: "1px solid #d4efdf"
        };
      case "absent":
        return {
          background: "#fdedec",
          color: "#dc2626",
          border: "1px solid #fadbd8"
        };
      case "off_day":
        return {
          background: "#f5f3ff",
          color: "#7c3aed",
          border: "1px dashed #ddd6fe"
        };
      case "no_class":
      default:
        return {
          background: "#f2f4f4",
          color: "#7f8c8d",
          border: "1px solid #e5e7eb"
        };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon icon-blue">
              <i className="fa-solid fa-calendar-days" />
            </div>
            <div>
              <div className="card-title">Student Monthly Attendance</div>
              <div className="card-sub">Select a student, month, and year to generate a full report</div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            {loadingStudents ? (
              <div style={{ flex: "1 1 240px" }}>
                <label className="form-label">STUDENT</label>
                <div className="form-control" style={{ background: "#f9fafb", display: "flex", alignItems: "center" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading...
                </div>
              </div>
            ) : (
              <SearchableStudentDropdown
                students={students}
                selectedId={selectedStudent}
                onChange={setSelectedStudent}
              />
            )}

            <div className="form-group" style={{ marginBottom: 0, flex: "1 1 180px" }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", color: "var(--text-soft)", textTransform: "uppercase" }}>COURSE</label>
              <select
                className="form-control"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ height: 38, borderRadius: 9 }}
                disabled={!selectedStudent || loadingCourses || courses.length === 0}
              >
                {loadingCourses ? (
                  <option value="">Loading courses...</option>
                ) : courses.length === 0 ? (
                  <option value="">No enrolled courses</option>
                ) : (
                  <>
                    <option value="">— Select Course —</option>
                    {courses.map((c) => (
                      <option key={c.course} value={c.course}>
                        {c.course_name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0, flex: "1 1 140px" }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", color: "var(--text-soft)", textTransform: "uppercase" }}>MONTH</label>
              <select
                className="form-control"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{ height: 38, borderRadius: 9 }}
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0, flex: "1 1 120px" }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", color: "var(--text-soft)", textTransform: "uppercase" }}>YEAR</label>
              <select
                className="form-control"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{ height: 38, borderRadius: 9 }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ background: "#0f172a", border: "none", height: 38, display: "inline-flex", alignItems: "center", gap: 8 }}
              onClick={handleGenerate}
              disabled={loading || loadingStudents || loadingCourses || !selectedCourse}
            >
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Generating...</>
              ) : (
                <><i className="fa-solid fa-magnifying-glass" /> Generate Report</>
              )}
            </button>
          </div>

          {errorMsg && (
            <div style={{ marginTop: 14, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="fa-solid fa-circle-exclamation" /> {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Report results container */}
      {loading ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: "var(--active)", marginBottom: 12 }} />
          <p style={{ color: "var(--text-soft)" }}>Retrieving attendance details...</p>
        </div>
      ) : report ? (
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Header Row: Student Card info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar circle */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#f97316",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  overflow: "hidden",
                  flexShrink: 0
                }}
              >
                {report.student.profile_picture ? (
                  <img src={report.student.profile_picture} alt={report.student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  getInitials(report.student.name)
                )}
              </div>

              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: 18, color: "var(--text-dark)", fontWeight: 700 }}>
                  {report.student.name}
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{report.student.id_display}</span>
                  <span>·</span>
                  <span style={{ fontWeight: 500, color: "var(--active)" }}>{report.student.experience_level}</span>
                  <span>·</span>
                  <span><i className="fa-solid fa-phone" style={{ fontSize: 10 }} /> {report.student.phone_number || "No Phone"}</span>
                </p>
              </div>
            </div>

            {/* Selected Month Date Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 20,
                fontSize: 12.5,
                color: "#1e40af",
                fontWeight: 600
              }}
            >
              <i className="fa-solid fa-calendar-days" />
              <span>{MONTHS[month - 1]} {year}</span>
            </div>
          </div>

          {/* Stats Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 1,
              background: "var(--border)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden"
            }}
          >
            {/* Total Classes */}
            <div style={{ background: "#fff", padding: "18px 20px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
                {report.summary.total_classes}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600 }}>
                Total Classes
              </div>
            </div>

            {/* Days Present */}
            <div style={{ background: "#fff", padding: "18px 20px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>
                {report.summary.days_present}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600 }}>
                Days Present
              </div>
            </div>

            {/* Days Absent */}
            <div style={{ background: "#fff", padding: "18px 20px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
                {report.summary.days_absent}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600 }}>
                Days Absent
              </div>
            </div>

            {/* Attendance Rate */}
            <div style={{ background: "#fff", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: "var(--text-dark)" }}>
                  {report.summary.attendance_rate}%
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 600 }}>
                Attendance Rate
              </div>
              {/* Optional minimal progress bar */}
              <div style={{ width: "100%", height: 4, background: "#e2e8f0", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${report.summary.attendance_rate}%`, height: "100%", background: report.summary.attendance_rate >= 80 ? "#16a34a" : report.summary.attendance_rate >= 50 ? "#d97706" : "#dc2626" }} />
              </div>
            </div>
          </div>

          {/* Month Grid Day View Section */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: 12, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
              <i className="fa-solid fa-hashtag" /> {MONTHS[month - 1]} {year} — Day View
            </h4>

            {/* Strip Grid of Days */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: 10, marginBottom: 20 }}>
              {report.day_view.map((dayObj) => {
                const bubbleStyle = getBubbleStyle(dayObj.status);
                return (
                  <div
                    key={dayObj.day}
                    style={{
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "default",
                      userSelect: "none",
                      transition: "transform 0.15s",
                      ...bubbleStyle
                    }}
                    title={`${MONTHS[month - 1]} ${dayObj.day}: ${dayObj.status.replace("_", " ")}`}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.0)"}
                  >
                    {dayObj.day}
                  </div>
                );
              })}
            </div>

            {/* Legend block */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              {[
                { label: "Present", color: "#16a34a", bg: "#eafaf1" },
                { label: "Absent", color: "#dc2626", bg: "#fdedec" },
                { label: "Off Day", color: "#7c3aed", bg: "#f5f3ff", border: "1px dashed #ddd6fe" },
                { label: "No Class", color: "#7f8c8d", bg: "#f2f4f4" }
              ].map((leg) => (
                <div key={leg.label} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: leg.bg,
                      border: leg.border || `1px solid ${leg.color}`
                    }}
                  />
                  <span style={{ color: "var(--text-soft)", fontWeight: 500 }}>{leg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Empty state or Details Table */}
          {report.summary.total_classes === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px", background: "#f9fafb", borderRadius: 12, border: "1px dashed var(--border)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifycontent: "center", justifyContent: "center", marginBottom: 14 }}>
                <i className="fa-solid fa-calendar-xmark" style={{ fontSize: 24, color: "#ef4444" }} />
              </div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: 15, fontWeight: 700, color: "var(--text-dark)" }}>
                No Records Found
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-soft)", textAlign: "center" }}>
                {report.student.name} has no attendance records for {MONTHS[month - 1]} {year}.
              </p>
            </div>
          ) : (
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Detailed Attendance Logs
                </h4>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ background: "#fafafa", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-soft)" }}>Date</th>
                      <th style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-soft)" }}>Course</th>
                      <th style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-soft)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.records.map((r, idx) => {
                      const pillMap = {
                        present: "pill pill-green",
                        absent: "pill pill-red",
                        late: "pill pill-amber"
                      };
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-dark)" }}>
                            {new Date(r.date).toLocaleDateString("en-PK", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}
                          </td>
                          <td style={{ padding: "12px 20px", color: "var(--text-soft)" }}>
                            {r.course}
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <span className={pillMap[r.status] || "pill pill-gray"}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Unsearched state Card */
        <div className="card" style={{ padding: "50px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <i className="fa-solid fa-chart-line" style={{ fontSize: 28, color: "#3b82f6" }} />
          </div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "var(--text-dark)" }}>
            Attendance Analytics
          </h4>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-soft)", textAlign: "center", maxWidth: 360, lineHeight: 1.5 }}>
            Please select a student and configure the report period, then click <strong>Generate Report</strong> to view statistical breakdowns and day logs.
          </p>
        </div>
      )}
    </div>
  );
}
