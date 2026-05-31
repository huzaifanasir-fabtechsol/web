import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCourse,
  getCourseEnrollment,
  bulkEnrollStudents,
  bulkUnenrollStudents,
} from "../api/courseStudentApi";

// ── Toast ──────────────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
const AVATAR_COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#22c55e","#ef4444","#a855f7",
];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CourseEnrollment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  // Course info
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  // Enrollment list
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("assigned");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);

  // Selection
  const [selected, setSelected] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState(null); // null | "enroll" | "unenroll"

  // Toast
  const [toast, setToast] = useState({ msg: "", type: "", show: false });
  const toastRef = useRef();
  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastRef.current);
    setToast({ msg, type, show: true });
    toastRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  // Load course details
  useEffect(() => {
    if (!accessToken || !id) return;
    setLoadingCourse(true);
    getCourse(accessToken, id)
      .then(setCourse)
      .catch(() => showToast("Failed to load course.", "error"))
      .finally(() => setLoadingCourse(false));
  }, [accessToken, id, showToast]);

  // Load enrollment data
  const fetchEnrollment = useCallback(async () => {
    if (!accessToken || !id) return;
    setLoading(true);
    try {
      const data = await getCourseEnrollment(accessToken, id, {
        tab,
        search: debouncedSearch,
        page,
      });
      setStudents(data.results || []);
      setTotalPages(data.total_pages);
      setTotalCount(data.count);
      setEnrolledCount(data.enrolled_count);
    } catch (e) {
      showToast("Failed to load students.", "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, id, tab, debouncedSearch, page, showToast]);

  useEffect(() => { fetchEnrollment(); }, [fetchEnrollment]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [tab, debouncedSearch]);

  // ── Selection Handlers ───────────────────────────────────────────────────
  const toggleSelect = (studentId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.id)));
    }
  };

  // ── Bulk Actions ─────────────────────────────────────────────────────────
  const handleBulkEnroll = async () => {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      const res = await bulkEnrollStudents(accessToken, id, [...selected]);
      showToast(res.detail || `${res.created} student(s) enrolled.`, "success");
      setSelected(new Set());
      setConfirmAction(null);
      fetchEnrollment();
    } catch (e) {
      showToast(e.message || "Failed to enroll students.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkUnenroll = async () => {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      const res = await bulkUnenrollStudents(accessToken, id, [...selected]);
      showToast(res.detail || `${res.removed} student(s) removed.`, "success");
      setSelected(new Set());
      setConfirmAction(null);
      fetchEnrollment();
    } catch (e) {
      showToast(e.message || "Failed to remove students.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingCourse) {
    return (
      <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "var(--text-soft)" }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: 12, color: "var(--active)" }} />
          <p>Loading course…</p>
        </div>
      </div>
    );
  }

  const startEntry = totalCount === 0 ? 0 : (page - 1) * 15 + 1;
  const endEntry = Math.min(page * 15, totalCount);

  const TABS = [
    { key: "assigned",   label: "Assigned Students",   icon: "fa-user-check",  color: "#16a34a" },
    { key: "unassigned", label: "Unassigned Students",  icon: "fa-user-plus",   color: "#3b82f6" },
    { key: "all",        label: "All Active Students",  icon: "fa-users",       color: "#8b5cf6" },
  ];

  return (
    <div className="content">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="act-btn"
              onClick={() => navigate("/courses")}
              title="Back to Courses"
              style={{ background: "#fff", border: "1px solid var(--border)" }}
            >
              <i className="fa-solid fa-arrow-left" style={{ color: "var(--text-mid)" }} />
            </button>
            <div>
              <h2>Manage Enrollment</h2>
              <p>{course?.name || "Course"} — Assign or remove students from this course.</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="pill pill-purple" style={{ fontSize: 13, padding: "6px 14px" }}>
            <i className="fa-solid fa-users" /> {enrolledCount} Enrolled
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TABS.map(({ key, label, icon, color }) => (
          <button
            key={key}
            className={`btn ${tab === key ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: 13 }}
            onClick={() => setTab(key)}
          >
            <i className={`fa-solid ${icon}`} style={{ color: tab === key ? "#fff" : color }} />
            {label}
          </button>
        ))}
      </div>

      {/* Bulk Action Toolbar */}
      {selected.size > 0 && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 16px", marginBottom: 16,
            background: "linear-gradient(135deg, #eff6ff, #f0f9ff)",
            borderRadius: 10, border: "1px solid #bfdbfe",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13, color: "#1e40af" }}>
            <i className="fa-solid fa-check-double" style={{ marginRight: 6 }} />
            {selected.size} student{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {(tab === "unassigned" || tab === "all") && (
              <button
                className="btn btn-sm btn-primary"
                style={{ fontSize: 12 }}
                onClick={() => setConfirmAction("enroll")}
                disabled={actionLoading}
              >
                <i className="fa-solid fa-user-plus" /> Enroll Selected
              </button>
            )}
            {(tab === "assigned" || tab === "all") && (
              <button
                className="btn btn-sm btn-danger"
                style={{ fontSize: 12 }}
                onClick={() => setConfirmAction("unenroll")}
                disabled={actionLoading}
              >
                <i className="fa-solid fa-user-minus" /> Remove Selected
              </button>
            )}
            <button
              className="btn btn-sm btn-outline"
              style={{ fontSize: 12 }}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Student Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Search by name, CNIC, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tbl-count">
            {loading ? "Loading…" : `Showing ${startEntry}–${endEntry} of ${totalCount}`}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={students.length > 0 && selected.size === students.length}
                    onChange={toggleSelectAll}
                    style={{ accentColor: "#3b82f6", cursor: "pointer" }}
                    title="Select All"
                  />
                </th>
                <th>Student</th>
                <th>CNIC</th>
                <th>Phone</th>
                <th>Experience</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin" /> Loading students…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <i className="fa-solid fa-users-slash" style={{ fontSize: 28, color: "var(--text-soft)" }} />
                      <span>
                        {tab === "assigned"
                          ? "No students enrolled yet. Go to the 'Unassigned' tab to enroll students."
                          : tab === "unassigned"
                          ? "All active students are already enrolled in this course!"
                          : "No active students found."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        style={{ accentColor: "#3b82f6", cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <div className="student-cell">
                        <div className="s-avatar" style={{ background: avatarColor(s.id) }}>
                          {s.profile_picture ? (
                            <img src={s.profile_picture} alt={s.name} />
                          ) : (
                            getInitials(s.name)
                          )}
                        </div>
                        <div>
                          <div className="s-name">{s.name}</div>
                          <div className="s-id">STU-{String(s.id).padStart(3, "0")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{s.cnic}</td>
                    <td style={{ fontSize: 12.5 }}>{s.phone_number}</td>
                    <td>
                      <span className={`pill ${
                        s.experience_level === "Advanced" ? "pill-purple" :
                        s.experience_level === "Intermediate" ? "pill-orange" : "pill-blue"
                      }`}>
                        {s.experience_level}
                      </span>
                    </td>
                    <td>
                      {s.is_enrolled ? (
                        <span className="pill pill-green" style={{ fontSize: 11 }}>
                          <i className="fa-solid fa-check" style={{ fontSize: 9, marginRight: 4 }} />
                          Enrolled
                        </span>
                      ) : (
                        <span className="pill pill-gray" style={{ fontSize: 11 }}>
                          Not Enrolled
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-group" style={{ justifyContent: "center" }}>
                        {s.is_enrolled ? (
                          <button
                            className="act-btn act-delete"
                            title="Remove from Course"
                            onClick={() => {
                              setSelected(new Set([s.id]));
                              setConfirmAction("unenroll");
                            }}
                          >
                            <i className="fa-solid fa-user-minus" />
                          </button>
                        ) : (
                          <button
                            className="act-btn act-view"
                            title="Enroll in Course"
                            style={{ color: "#16a34a" }}
                            onClick={async () => {
                              try {
                                await bulkEnrollStudents(accessToken, id, [s.id]);
                                showToast(`${s.name} enrolled successfully.`, "success");
                                fetchEnrollment();
                              } catch (e) {
                                showToast(e.message, "error");
                              }
                            }}
                          >
                            <i className="fa-solid fa-user-plus" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-footer">
            <div className="page-info">
              Showing {startEntry} to {endEntry} of {totalCount} entries
            </div>
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <i className="fa-solid fa-chevron-left" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <div className={`modal-overlay ${confirmAction ? "open" : ""}`}>
        <div className="modal" style={{ width: 440 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div
                className={`card-icon ${confirmAction === "enroll" ? "icon-green" : "icon-red"}`}
                style={{ width: 32, height: 32, fontSize: 14 }}
              >
                <i className={`fa-solid ${confirmAction === "enroll" ? "fa-user-plus" : "fa-user-minus"}`} />
              </div>
              <h3>{confirmAction === "enroll" ? "Confirm Enrollment" : "Confirm Removal"}</h3>
            </div>
            <button className="modal-close" onClick={() => setConfirmAction(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {confirmAction === "enroll"
                ? `Are you sure you want to enroll ${selected.size} student${selected.size !== 1 ? "s" : ""} into "${course?.name}"?`
                : `Are you sure you want to remove ${selected.size} student${selected.size !== 1 ? "s" : ""} from "${course?.name}"? They will no longer appear in attendance for this course.`}
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
              Cancel
            </button>
            <button
              className={`btn ${confirmAction === "enroll" ? "btn-primary" : "btn-danger"}`}
              onClick={confirmAction === "enroll" ? handleBulkEnroll : handleBulkUnenroll}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Processing…</>
              ) : confirmAction === "enroll" ? (
                "Enroll Students"
              ) : (
                "Remove Students"
              )}
            </button>
          </div>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} show={toast.show} />
    </div>
  );
}
