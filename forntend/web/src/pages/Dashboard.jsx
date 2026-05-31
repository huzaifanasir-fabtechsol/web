import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardSummary,
  getRevenueTrend,
  getLatestHorses,
  getLatestStudents,
} from "../api/dashboardApi";

// ── Tiny inline bar-chart (no external deps) ──────────────────────────────────
function RevenueChart({ data, loading }) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: "var(--text-soft)" }} />
      </div>
    );
  }
  if (!data.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
        <span style={{ color: "var(--text-soft)", fontSize: 13 }}>No revenue data</span>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.revenue), 1);
  const CHART_H = 180;
  const totalW = data.length * 36;

  return (
    <div style={{ width: "100%", padding: "0 16px" }}>
      {/* Chart container */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: CHART_H,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 8,
          gap: "8px",
        }}
      >
        {data.map((d, i) => {
          const percentage = (d.revenue / max) * 100;
          const isLast = i === data.length - 1;
          const defaultBarColor = isLast ? "#1a1f2e" : "#e5e7eb";
          const hoverBarColor = isLast ? "#374151" : "#d1d5db";
          const labelColor = isLast ? "#1a1f2e" : "#9ca3af";
          const labelWeight = isLast ? "700" : "400";

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: "1",
                minWidth: 0,
                height: "100%",
                justifyContent: "flex-end",
                position: "relative",
              }}
            >
              {/* Amount on top */}
              {d.revenue > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 6,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    position: "absolute",
                    bottom: `calc(${Math.max(percentage, 4)}% + 6px)`,
                  }}
                >
                  {d.revenue >= 1000
                    ? `${(d.revenue / 1000).toFixed(1)}k`
                    : d.revenue}
                </span>
              )}

              {/* Bar */}
              <div
                style={{
                  width: "100%",
                  maxWidth: 32,
                  height: `${Math.max(percentage, d.revenue > 0 ? 4 : 0)}%`,
                  backgroundColor: defaultBarColor,
                  borderRadius: "5px 5px 0 0",
                  transition: "height 0.4s ease, background-color 0.2s ease",
                  cursor: "pointer",
                }}
                title={`${d.label}: Rs. ${d.revenue.toLocaleString()}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverBarColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = defaultBarColor;
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 10,
          gap: "8px",
        }}
      >
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const labelColor = isLast ? "#1a1f2e" : "#9ca3af";
          const labelWeight = isLast ? "700" : "400";
          const shortLabel = d.label.length > 6 ? d.label.slice(5) : d.label;

          return (
            <div
              key={i}
              style={{
                flex: "1",
                textAlign: "center",
                fontSize: 10,
                color: labelColor,
                fontWeight: labelWeight,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shortLabel}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#22c55e", "#ef4444", "#a855f7",
];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

function TrendBadge({ trend }) {
  if (!trend) return null;
  const { value, direction } = trend;
  const cls =
    direction === "up" ? "badge-up" :
      direction === "down" ? "badge-down" : "badge-neutral";
  const icon =
    direction === "up" ? "fa-arrow-trend-up" :
      direction === "down" ? "fa-arrow-trend-down" : "fa-minus";
  const sign = direction === "up" ? "+" : direction === "down" ? "-" : "";
  return (
    <div className={`stat-badge ${cls}`} style={{ marginTop: 10 }}>
      <i className={`fa-solid ${icon}`} />
      {sign}{value}%
    </div>
  );
}

function StatCard({ label, value, icon, iconCls, trend, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className={`stat-icon ${iconCls}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
      </div>
      <TrendBadge trend={trend} />
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function Skeleton({ h = 16, w = "100%", r = 6 }) {
  return (
    <div
      style={{
        height: h, width: w, borderRadius: r,
        background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { accessToken: token } = useAuth();

  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartRange, setChartRange] = useState("last12Months");
  const [latestHorses, setLatestHorses] = useState([]);
  const [latestStudents, setLatestStudents] = useState([]);

  const [loadSummary, setLoadSummary] = useState(true);
  const [loadChart, setLoadChart] = useState(true);
  const [loadHorses, setLoadHorses] = useState(true);
  const [loadStudents, setLoadStudents] = useState(true);

  // Fetch summary + latest tables on mount
  useEffect(() => {
    getDashboardSummary(token)
      .then(setSummary)
      .finally(() => setLoadSummary(false));

    getLatestHorses(token)
      .then((r) => setLatestHorses(r.results || []))
      .finally(() => setLoadHorses(false));

    getLatestStudents(token)
      .then((r) => setLatestStudents(r.results || []))
      .finally(() => setLoadStudents(false));
  }, [token]);

  // Fetch chart whenever range changes
  const fetchChart = useCallback(() => {
    setLoadChart(true);
    getRevenueTrend(token, chartRange)
      .then(setChartData)
      .finally(() => setLoadChart(false));
  }, [token, chartRange]);

  useEffect(() => { fetchChart(); }, [fetchChart]);

  // ── Derived stat values ──────────────────────────────────────────────────
  const fmt = (n) =>
    new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);
  const fmtPKR = (n) =>
    `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n)}`;

  const paid = summary?.revenue?.paidAmount ?? 0;
  const pending = summary?.revenue?.pendingAmount ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="content">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Dashboard Overview</h2>
          <p>Here's what's happening at your riding school today.</p>
        </div>
        {/* <Link to="/students" className="btn btn-primary">
          <i className="fa-solid fa-plus" /> Add Student
        </Link> */}
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        {loadSummary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton h={12} w="60%" />
              <Skeleton h={36} w="40%" />
              <Skeleton h={22} w="35%" r={12} />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total Students"
              value={fmt(summary?.totalStudents?.count ?? 0)}
              icon="fa-users"
              iconCls="icon-blue"
              trend={summary?.totalStudents?.trend}
              sub="vs last month"
            />
            <StatCard
              label="Total Horses"
              value={fmt(summary?.horses?.count ?? 0)}
              icon="fa-horse-head"
              iconCls="icon-orange"
              trend={summary?.horses?.trend}
              sub="vs last month"
            />
            <StatCard
              label="Revenue"
              value={fmtPKR(paid)}
              icon="fa-sack-dollar"
              iconCls="icon-green"
              trend={summary?.revenue?.trend}
              sub="paid this month"
            />
            <StatCard
              label="Active Courses"
              value={fmt(summary?.courses?.count ?? 0)}
              icon="fa-book-open"
              iconCls="icon-purple"
              trend={summary?.courses?.trend}
              sub="vs last month"
            />
          </>
        )}
      </div>

      {/* ── Revenue mini row ── */}
      {!loadSummary && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Paid Amount", amount: paid, cls: "icon-green", icon: "fa-circle-check", color: "#16a34a" },
            { label: "Pending Amount", amount: pending, cls: "icon-amber", icon: "fa-clock", color: "#d97706" },
          ].map(({ label, amount, cls, icon, color }) => (
            <div key={label} className="mini-card">
              <div className={`mini-icon ${cls}`}>
                <i className={`fa-solid ${icon}`} />
              </div>
              <div>
                <div className="mini-val" style={{ fontSize: 20, color }}>{fmtPKR(amount)}</div>
                <div className="mini-lbl">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Revenue Chart ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon icon-blue">
              <i className="fa-solid fa-chart-line" />
            </div>
            <div>
              <div className="card-title">Revenue Analytics</div>
              <div className="card-sub">Monthly paid revenue</div>
            </div>
          </div>
          <select
            className="filter-select"
            value={chartRange}
            onChange={(e) => setChartRange(e.target.value)}
          >
            <option value="last12Months">Last 12 Months</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>
        <div className="card-body" style={{ paddingTop: 20, paddingBottom: 8 }}>
          <RevenueChart data={chartData} loading={loadChart} />
        </div>
      </div>

      {/* ── Latest Students + Latest Horses (side by side) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 0 }}>

        {/* Latest Students */}
        <div className="table-card">
          <div className="table-toolbar" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="table-title">
              <i className="fa-solid fa-users" style={{ marginRight: 8, color: "#3b82f6", fontSize: 13 }} />
              Latest Students
            </div>
            <Link
              to="/students"
              style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textDecoration: "none" }}
            >
              View All <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
            </Link>
          </div>
          {loadStudents ? (
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Skeleton h={32} w={32} r={50} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton h={11} w="55%" />
                    <Skeleton h={9} w="35%" />
                  </div>
                  <Skeleton h={20} w={52} r={20} />
                </div>
              ))}
            </div>
          ) : latestStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 20px" }}>
              <i className="fa-solid fa-users-slash" />
              <p>No students yet.</p>
            </div>
          ) : (
            <div>
              {latestStudents.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", borderBottom: "1px solid var(--border)",
                    transition: "background .2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = ""}
                >
                  <div
                    className="s-avatar"
                    style={{ background: avatarColor(s.id), flexShrink: 0 }}
                  >
                    {s.profile_picture
                      ? <img src={s.profile_picture} alt={s.name} />
                      : getInitials(s.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="s-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </div>
                    <div className="s-id">{s.student_id} · {s.experience_level}</div>
                  </div>
                  <span
                    className={`pill ${s.is_active ? "pill-green" : "pill-red"}`}
                    style={{ flexShrink: 0 }}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Horses */}
        <div className="table-card">
          <div className="table-toolbar" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="table-title">
              <i className="fa-solid fa-horse-head" style={{ marginRight: 8, color: "#f97316", fontSize: 13 }} />
              Latest Horses
            </div>
            <Link
              to="/horses"
              style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textDecoration: "none" }}
            >
              View All <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
            </Link>
          </div>
          {loadHorses ? (
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Skeleton h={32} w={32} r={8} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton h={11} w="55%" />
                    <Skeleton h={9} w="45%" />
                  </div>
                  <Skeleton h={20} w={52} r={20} />
                </div>
              ))}
            </div>
          ) : latestHorses.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 20px" }}>
              <i className="fa-solid fa-horse-head" />
              <p>No horses yet.</p>
            </div>
          ) : (
            <div>
              {latestHorses.map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px", borderBottom: "1px solid var(--border)",
                    transition: "background .2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = ""}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: "#fff7ed", display: "flex", alignItems: "center",
                      justifyContent: "center", border: "1px solid #fed7aa",
                    }}
                  >
                    <i className="fa-solid fa-horse-head" style={{ color: "#f97316", fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="s-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h.horse_name}
                    </div>
                    <div className="s-id">{h.breed} · {h.color}</div>
                  </div>
                  <span className="pill pill-orange" style={{ flexShrink: 0 }}>{h.gender}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
