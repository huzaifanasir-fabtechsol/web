import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getReportsDashboard } from "../api/reportsApi";

function Skeleton({ h = 16, w = "100%", r = 6 }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#22c55e", "#ef4444", "#a855f7",
];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function Reports() {
  const { accessToken: token } = useAuth();
  const [filter, setFilter] = useState("allTime");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReportsDashboard(token, filter)
      .then(setData)
      .catch((err) => console.error("Failed to load reports:", err))
      .finally(() => setLoading(false));
  }, [token, filter]);

  const fmt = (n) =>
    new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);
  const fmtPKR = (n) =>
    `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n)}`;

  const filters = [
    { key: "allTime", label: "All Time" },
    { key: "thisYear", label: "This Year" },
    { key: "thisMonth", label: "This Month" },
    { key: "lastYear", label: "Last Year" },
    { key: "lastMonth", label: "Last Month" },
  ];

  return (
    <div className="content">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h2>Reports &amp; Analytics</h2>
          <p>Analyze performance metrics, enrollments, billing, and student attendance.</p>
        </div>
        {/* Dynamic Filters Capsules */}
        <div style={{ display: "flex", gap: 8, background: "#f3f4f6", padding: 4, borderRadius: 8 }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                border: "none",
                outline: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: filter === f.key ? "#ffffff" : "transparent",
                color: filter === f.key ? "#1f2937" : "#6b7280",
                boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton h={12} w="60%" />
              <Skeleton h={36} w="40%" />
            </div>
          ))
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <div className="stat-label">Total Students</div>
                  <div className="stat-value">{fmt(data?.summary?.totalStudents ?? 0)}</div>
                </div>
                <div className="stat-icon icon-blue">
                  <i className="fa-solid fa-user-graduate" />
                </div>
              </div>
              <span className="stat-sub">New registrations</span>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <div className="stat-label">Total Courses</div>
                  <div className="stat-value">{fmt(data?.summary?.totalCourses ?? 0)}</div>
                </div>
                <div className="stat-icon icon-purple">
                  <i className="fa-solid fa-book-open" />
                </div>
              </div>
              <span className="stat-sub">Active syllabus</span>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <div className="stat-label">Total Horses</div>
                  <div className="stat-value">{fmt(data?.summary?.totalHorses ?? 0)}</div>
                </div>
                <div className="stat-icon icon-orange">
                  <i className="fa-solid fa-horse-head" />
                </div>
              </div>
              <span className="stat-sub">Stable capacity</span>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <div className="stat-label">Total Horse Owners</div>
                  <div className="stat-value">{fmt(data?.summary?.totalOwners ?? 0)}</div>
                </div>
                <div className="stat-icon icon-blue" style={{ color: "#2563eb", background: "#dbeafe" }}>
                  <i className="fa-solid fa-address-book" />
                </div>
              </div>
              <span className="stat-sub">Active stakeholders</span>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <div className="stat-label">Total Workers</div>
                  <div className="stat-value">{fmt(data?.summary?.totalWorkers ?? 0)}</div>
                </div>
                <div className="stat-icon icon-pink" style={{ color: "#db2777", background: "#fce7f3" }}>
                  <i className="fa-solid fa-user-tie" />
                </div>
              </div>
              <span className="stat-sub">Staff headcount</span>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <div className="stat-label">Approved Revenue</div>
                  <div className="stat-value" style={{ color: "#16a34a" }}>
                    {fmtPKR(data?.summary?.approvedAmount ?? 0)}
                  </div>
                </div>
                <div className="stat-icon icon-green">
                  <i className="fa-solid fa-sack-dollar" />
                </div>
              </div>
              <span className="stat-sub">Collected payments</span>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <div className="stat-label">Pending Revenue</div>
                  <div className="stat-value" style={{ color: "#ea580c" }}>
                    {fmtPKR(data?.summary?.pendingAmount ?? 0)}
                  </div>
                </div>
                <div className="stat-icon icon-orange" style={{ color: "#ea580c", background: "#ffedd5" }}>
                  <i className="fa-solid fa-clock" />
                </div>
              </div>
              <span className="stat-sub">Outstanding dues</span>
            </div>
          </>
        )}
      </div>

      {/* Side-by-Side: Top Courses & Consistently Absent Students */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        
        {/* Top Courses */}
        <div className="table-card" style={{ height: "fit-content" }}>
          <div className="table-toolbar" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="table-title">
              <i className="fa-solid fa-trophy" style={{ marginRight: 8, color: "#eab308", fontSize: 13 }} />
              Top 5 Courses
            </div>
            <div style={{ fontSize: 12, color: "var(--text-soft)" }}>By Enrollment Count</div>
          </div>
          
          {loading ? (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Skeleton h={12} w="40%" />
                    <Skeleton h={12} w="15%" />
                  </div>
                  <Skeleton h={8} w="100%" r={4} />
                </div>
              ))}
            </div>
          ) : !data?.topCourses || data.topCourses.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <i className="fa-solid fa-book-open" style={{ fontSize: 24, marginBottom: 8 }} />
              <p>No enrollment data available</p>
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {data.topCourses.map((c, index) => {
                const maxEnrolled = Math.max(...data.topCourses.map(x => x.enrolled_count), 1);
                const percent = (c.enrolled_count / maxEnrolled) * 100;
                
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "12px 20px",
                      borderBottom: index < data.topCourses.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-soft)" }}>#{index + 1}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-dark)" }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent1)" }}>
                        {c.enrolled_count} {c.enrolled_count === 1 ? "student" : "students"}
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ background: "#e5e7eb", height: 6, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div
                        style={{
                          background: "var(--accent1)",
                          width: `${percent}%`,
                          height: "100%",
                          borderRadius: 3,
                          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Consistently Absent Students */}
        <div className="table-card" style={{ height: "fit-content" }}>
          <div className="table-toolbar" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="table-title">
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8, color: "#ef4444", fontSize: 13 }} />
              Consistently Absent Students
            </div>
            <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>Absent last 3 class days</div>
          </div>

          {loading ? (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Skeleton h={32} w={32} r={50} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton h={11} w="60%" />
                    <Skeleton h={9} w="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.consistentlyAbsentStudents || data.consistentlyAbsentStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <i className="fa-solid fa-circle-check" style={{ color: "#22c55e", fontSize: 24, marginBottom: 8 }} />
              <p style={{ color: "var(--text-soft)" }}>No consistently absent students. Good job!</p>
            </div>
          ) : (
            <div style={{ maxHeight: 310, overflowY: "auto" }}>
              {data.consistentlyAbsentStudents.map((s, index) => (
                <div
                  key={`${s.student_id}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 20px",
                    borderBottom: index < data.consistentlyAbsentStudents.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div
                    className="s-avatar"
                    style={{ background: avatarColor(s.student_id), flexShrink: 0 }}
                  >
                    {s.profile_picture ? (
                      <img src={s.profile_picture} alt={s.name} />
                    ) : (
                      getInitials(s.name)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div className="s-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.name}
                      </div>
                      <span className="pill pill-red" style={{ fontSize: 10, padding: "2px 6px" }}>
                        3 Consecutive Absences
                      </span>
                    </div>
                    <div className="s-id">
                      {s.student_id_display} · {s.experience_level} · <strong style={{ color: "var(--text-dark)" }}>{s.course_name}</strong>
                    </div>
                    {/* Specific absent dates */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      {s.last_absent_dates.map((d) => (
                        <span
                          key={d}
                          style={{
                            fontSize: 10,
                            background: "#fee2e2",
                            color: "#b91c1c",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 500,
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest Transactions */}
      <div className="table-card">
        <div className="table-toolbar" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="table-title">
            <i className="fa-solid fa-money-bill-wave" style={{ marginRight: 8, color: "#16a34a", fontSize: 13 }} />
            Latest Transactions
          </div>
          <div style={{ fontSize: 12, color: "var(--text-soft)" }}>Up to 10 entries</div>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                <Skeleton h={20} w="15%" />
                <Skeleton h={20} w="35%" />
                <Skeleton h={20} w="20%" />
                <Skeleton h={20} w="15%" />
                <Skeleton h={20} w="15%" />
              </div>
            ))}
          </div>
        ) : !data?.latestTransactions || data.latestTransactions.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 20px" }}>
            <i className="fa-solid fa-receipt" style={{ fontSize: 24, marginBottom: 8 }} />
            <p>No transaction history found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Course</th>
                  <th>Fee Type</th>
                  <th>Method</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.latestTransactions.map((t) => {
                  const statusPill =
                    t.status === "Paid" ? "pill-green" :
                    t.status === "Pending" ? "pill-orange" : "pill-red";
                  
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.student_name}</td>
                      <td>{t.student_id_display}</td>
                      <td>{t.course_name}</td>
                      <td>{t.fee_type}</td>
                      <td>{t.payment_method}</td>
                      <td>{t.date}</td>
                      <td style={{ fontWeight: 700, color: t.status === "Paid" ? "#16a34a" : "inherit" }}>
                        {fmtPKR(t.amount)}
                      </td>
                      <td>
                        <span className={`pill ${statusPill}`}>{t.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
