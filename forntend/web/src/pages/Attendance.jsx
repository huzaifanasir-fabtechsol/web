import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { listCourses } from "../api/courseStudentApi";
import {
  getCourseStudentsForAttendance,
  bulkLogAttendance,
  listAttendance,
} from "../api/attendanceApi";

// ── Helpers ────────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#22c55e","#ef4444","#a855f7",
];
function avatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function Toast({ msg, type, show }) {
  if (!msg) return null;
  return (
    <div className={`toast ${show ? "show" : ""} ${type}`}>
      <i className={`fa-solid ${
        type === "success" ? "fa-circle-check" :
        type === "error"   ? "fa-circle-xmark" : "fa-circle-info"
      }`} />
      {msg}
    </div>
  );
}

// ── Status pill helper ─────────────────────────────────────────────────────────

function StatusPill({ status }) {
  if (!status) return <span className="pill pill-gray">—</span>;
  const map = {
    present: "pill-green",
    absent:  "pill-red",
    late:    "pill-amber",
  };
  return (
    <span className={`pill ${map[status] ?? "pill-gray"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Attendance() {
  const { accessToken: token } = useAuth();

  // ── Selection state ──────────────────────────────────────────────────────
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate]               = useState(today());

  // ── Log (marking) state ──────────────────────────────────────────────────
  const [students, setStudents]       = useState([]);   // [{student_id, name, …, status, remarks}]
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving]           = useState(false);

  // ── Records (history) state ───────────────────────────────────────────────
  const [records, setRecords]         = useState([]);
  const [recTotal, setRecTotal]       = useState(0);
  const [recPage, setRecPage]         = useState(1);
  const [recTotalPages, setRecTotalPages] = useState(1);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState("log"); // "log" | "records"
  const [toast, setToast]             = useState({ msg: "", type: "", show: false });
  const toastRef                      = useRef();

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastRef.current);
    setToast({ msg, type, show: true });
    toastRef.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      3200
    );
  }, []);

  // ── Load courses on mount ─────────────────────────────────────────────────
  useEffect(() => {
    listCourses(token, { page_size: 100 })
      .then((r) => {
        const allCourses = r.results || [];
        setCourses(allCourses);
        
        // Filter by today's day of the week
        const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const todayCourses = allCourses.filter((c) => {
          if (Array.isArray(c.class_days)) return c.class_days.includes(todayDay);
          if (typeof c.class_days === "string") {
            try {
              const parsed = JSON.parse(c.class_days);
              if (Array.isArray(parsed)) return parsed.includes(todayDay);
            } catch (e) {
              return c.class_days.includes(todayDay);
            }
          }
          return false;
        });
        
        if (todayCourses.length) {
          setSelectedCourse(String(todayCourses[0].id));
        } else {
          setSelectedCourse("");
        }
      })
      .catch(() => showToast("Failed to load courses.", "error"));
  }, [token, showToast]);

  // ── Load students when course/date changes ────────────────────────────────
  useEffect(() => {
    if (!selectedCourse) return;
    setLoadingStudents(true);
    getCourseStudentsForAttendance(token, selectedCourse, date)
      .then((r) => {
        setStudents(
          (r.students || []).map((s) => ({
            ...s,
            status:  s.status  ?? "present",   // default to present
            remarks: s.remarks ?? "",
          }))
        );
      })
      .catch(() => showToast("Failed to load students.", "error"))
      .finally(() => setLoadingStudents(false));
  }, [selectedCourse, date, token, showToast]);

  // ── Load records when tab or filters change ───────────────────────────────
  const fetchRecords = useCallback(() => {
    setLoadingRecords(true);
    const filters = {
      month: filterMonth,
      year:  filterYear,
      page:  recPage,
      page_size: 15,
    };
    if (filterStatus) filters.status   = filterStatus;
    if (filterCourse) filters.course_id = filterCourse;

    listAttendance(token, filters)
      .then((r) => {
        setRecords(r.results || []);
        setRecTotal(r.count   || 0);
        setRecTotalPages(r.total_pages || 1);
      })
      .catch(() => showToast("Failed to load records.", "error"))
      .finally(() => setLoadingRecords(false));
  }, [token, filterMonth, filterYear, filterStatus, filterCourse, recPage, showToast]);

  useEffect(() => {
    if (activeTab === "records") fetchRecords();
  }, [activeTab, fetchRecords]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStatusChange = (studentId, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => s.student_id === studentId ? { ...s, status: newStatus } : s)
    );
  };

  const handleRemarksChange = (studentId, value) => {
    setStudents((prev) =>
      prev.map((s) => s.student_id === studentId ? { ...s, remarks: value } : s)
    );
  };

  const markAll = (status) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!selectedCourse) { showToast("Please select a course.", "error"); return; }
    if (!date)           { showToast("Please select a date.", "error"); return; }
    if (!students.length){ showToast("No students to mark.", "error"); return; }

    setSaving(true);
    try {
      const payload = {
        course_id:  parseInt(selectedCourse),
        date,
        attendance: students.map((s) => ({
          student_id: s.student_id,
          status:     s.status,
          remarks:    s.remarks,
        })),
      };
      const res = await bulkLogAttendance(token, payload);
      showToast(
        `Attendance saved! ${res.created} created, ${res.updated} updated.`,
        "success"
      );
    } catch (err) {
      showToast(err.message || "Failed to save attendance.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Summary counts ────────────────────────────────────────────────────────
  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount  = students.filter((s) => s.status === "absent").length;
  const lateCount    = students.filter((s) => s.status === "late").length;

  // ── Course name helper ────────────────────────────────────────────────────
  const courseName = courses.find((c) => String(c.id) === selectedCourse)?.name ?? "";

  // ── Months for filter ─────────────────────────────────────────────────────
  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const YEARS = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);

  // Filter courses for current day dropdown selection
  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayCourses = courses.filter((c) => {
    if (Array.isArray(c.class_days)) return c.class_days.includes(todayDay);
    if (typeof c.class_days === "string") {
      try {
        const parsed = JSON.parse(c.class_days);
        if (Array.isArray(parsed)) return parsed.includes(todayDay);
      } catch (e) {
        return c.class_days.includes(todayDay);
      }
    }
    return false;
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="content">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Attendance Log</h2>
          <p>Mark and track daily attendance for classes.</p>
        </div>
        {activeTab === "log" && (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loadingStudents}
          >
            <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "log",     icon: "fa-calendar-check", label: "Mark Attendance" },
          { key: "records", icon: "fa-table-list",      label: "View Records"   },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            className={`btn ${activeTab === key ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: 13 }}
            onClick={() => setActiveTab(key)}
          >
            <i className={`fa-solid ${icon}`} />
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: MARK ATTENDANCE
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "log" && (
        <>
          {/* Class Selection Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon icon-blue">
                  <i className="fa-solid fa-calendar-check" />
                </div>
                <div>
                  <div className="card-title">Class Selection</div>
                  <div className="card-sub">Select course and date to mark attendance</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: "1 1 220px" }}>
                  <label className="form-label">Select Course</label>
                  <select
                    className="form-control"
                    value={selectedCourse}
                    onChange={(e) => { setSelectedCourse(e.target.value); }}
                  >
                    <option value="">— Select course —</option>
                    {todayCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: "1 1 180px" }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary mini cards */}
          {students.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Present", count: presentCount, cls: "icon-green",  icon: "fa-circle-check" },
                { label: "Absent",  count: absentCount,  cls: "icon-red",    icon: "fa-circle-xmark" },
                { label: "Late",    count: lateCount,    cls: "icon-amber",  icon: "fa-clock" },
              ].map(({ label, count, cls, icon }) => (
                <div key={label} className="mini-card">
                  <div className={`mini-icon ${cls}`}>
                    <i className={`fa-solid ${icon}`} />
                  </div>
                  <div>
                    <div className="mini-val">{count}</div>
                    <div className="mini-lbl">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student Table */}
          <div className="table-card">
            <div className="table-toolbar">
              <div className="table-title">
                Student List ({loadingStudents ? "…" : students.length})
                {courseName && (
                  <span style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 400, marginLeft: 8 }}>
                    · {courseName}
                  </span>
                )}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button className="btn btn-sm btn-outline" onClick={() => markAll("present")}>
                  <i className="fa-solid fa-circle-check" style={{ color: "#16a34a" }} /> Mark All Present
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => markAll("absent")}>
                  <i className="fa-solid fa-circle-xmark" style={{ color: "#dc2626" }} /> Mark All Absent
                </button>
              </div>
            </div>

            <div className="table-wrap">
              {loadingStudents ? (
                <div className="empty-state">
                  <i className="fa-solid fa-spinner fa-spin" />
                  <p>Loading students…</p>
                </div>
              ) : !selectedCourse ? (
                <div className="empty-state">
                  <i className="fa-solid fa-chalkboard-user" />
                  <h4>No Course Selected</h4>
                  <p>Select a course above to load students.</p>
                </div>
              ) : students.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-users-slash" />
                  <h4>No Students Found</h4>
                  <p>There are no active students registered in the system.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Attendance Status</th>
                      <th>Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id}>
                        {/* Student ID */}
                        <td>
                          <span className="s-id" style={{ color: "var(--text-dark)", fontWeight: 600 }}>
                            {student.student_id_display}
                          </span>
                        </td>

                        {/* Name + Avatar */}
                        <td>
                          <div className="student-cell">
                            <div
                              className="s-avatar"
                              style={{ background: avatarColor(student.student_id) }}
                            >
                              {student.profile_picture ? (
                                <img src={student.profile_picture} alt={student.name} />
                              ) : (
                                getInitials(student.name)
                              )}
                            </div>
                            <span className="s-name">{student.name}</span>
                          </div>
                        </td>

                        {/* Radio buttons */}
                        <td>
                          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                            {[
                              { val: "present", color: "#16a34a" },
                              { val: "absent",  color: "#dc2626" },
                              { val: "late",    color: "#d97706" },
                            ].map(({ val, color }) => (
                              <label
                                key={val}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  cursor: "pointer", fontSize: 13,
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`status-${student.student_id}`}
                                  checked={student.status === val}
                                  onChange={() => handleStatusChange(student.student_id, val)}
                                  style={{ accentColor: color }}
                                />
                                <span style={{
                                  color,
                                  fontWeight: student.status === val ? 700 : 400,
                                  transition: "font-weight .15s",
                                }}>
                                  {val.charAt(0).toUpperCase() + val.slice(1)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>

                        {/* Remarks */}
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            style={{ height: 34, padding: "0 10px", fontSize: 12.5 }}
                            placeholder="Notes…"
                            value={student.remarks}
                            onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            {students.length > 0 && (
              <div className="table-footer">
                <span className="page-info">
                  {students.length} student{students.length !== 1 ? "s" : ""} ·{" "}
                  <strong style={{ color: "#16a34a" }}>{presentCount} present</strong> ·{" "}
                  <strong style={{ color: "#dc2626" }}>{absentCount} absent</strong> ·{" "}
                  <strong style={{ color: "#d97706" }}>{lateCount} late</strong>
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
                  {saving ? "Saving…" : "Save Attendance"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: RECORDS
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "records" && (
        <>
          {/* Filters */}
          <div className="table-card" style={{ marginBottom: 20 }}>
            <div className="table-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
              {/* Month */}
              <select
                className="filter-select"
                value={filterMonth}
                onChange={(e) => { setFilterMonth(Number(e.target.value)); setRecPage(1); }}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>

              {/* Year */}
              <select
                className="filter-select"
                value={filterYear}
                onChange={(e) => { setFilterYear(Number(e.target.value)); setRecPage(1); }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {/* Status */}
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setRecPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>

              {/* Course */}
              <select
                className="filter-select"
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value); setRecPage(1); }}
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                className="btn btn-sm btn-outline"
                onClick={fetchRecords}
                disabled={loadingRecords}
              >
                <i className={`fa-solid ${loadingRecords ? "fa-spinner fa-spin" : "fa-rotate-right"}`} />
                Refresh
              </button>

              <span className="tbl-count">{recTotal} record{recTotal !== 1 ? "s" : ""}</span>
            </div>

            <div className="table-wrap">
              {loadingRecords ? (
                <div className="empty-state">
                  <i className="fa-solid fa-spinner fa-spin" />
                  <p>Loading records…</p>
                </div>
              ) : records.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-clipboard-list" />
                  <h4>No Records Found</h4>
                  <p>No attendance records match the selected filters.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: "var(--text-dark)" }}>
                          {new Date(r.date).toLocaleDateString("en-PK", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td>
                          <div className="student-cell">
                            <div
                              className="s-avatar"
                              style={{ background: avatarColor(r.student) }}
                            >
                              {r.profile_picture ? (
                                <img src={r.profile_picture} alt={r.student_name} />
                              ) : (
                                getInitials(r.student_name)
                              )}
                            </div>
                            <div>
                              <div className="s-name">{r.student_name}</div>
                              <div className="s-id">{r.student_id_display}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-mid)", fontSize: 12.5 }}>{r.course_name}</td>
                        <td><StatusPill status={r.status} /></td>
                        <td style={{ color: "var(--text-soft)", fontSize: 12.5 }}>
                          {r.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {recTotalPages > 1 && (
              <div className="table-footer">
                <span className="page-info">
                  Page {recPage} of {recTotalPages}
                </span>
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={recPage <= 1}
                    onClick={() => setRecPage((p) => p - 1)}
                  >
                    <i className="fa-solid fa-chevron-left" style={{ fontSize: 10 }} />
                  </button>
                  {Array.from({ length: Math.min(recTotalPages, 7) }, (_, i) => {
                    const pg = i + 1;
                    return (
                      <button
                        key={pg}
                        className={`page-btn ${recPage === pg ? "active" : ""}`}
                        onClick={() => setRecPage(pg)}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    className="page-btn"
                    disabled={recPage >= recTotalPages}
                    onClick={() => setRecPage((p) => p + 1)}
                  >
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} show={toast.show} />
    </div>
  );
}
