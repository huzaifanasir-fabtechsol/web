import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  listTransactions,
  deleteTransaction,
} from "../../api/billingApi";
import { listCourses } from "../../api/courseStudentApi";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const STATUSES = ["Paid", "Pending", "Failed"];
const METHODS = ["Cash", "Bank Transfer", "Card", "JazzCash", "EasyPaisa"];
const FEE_TYPES = ["Registration Fee", "Course Fee"];

const STATUS_PILL = { Paid: "pill-green", Pending: "pill-orange", Failed: "pill-red" };
const METHOD_ICON = {
  Cash: "fa-money-bill",
  "Bank Transfer": "fa-building-columns",
  Card: "fa-credit-card",
  JazzCash: "fa-mobile-screen",
  EasyPaisa: "fa-wallet",
};

export default function Transactions() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // ── Data ─────────────────────────────────────────────────────────────────
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterFeeType, setFilterFeeType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [page, setPage] = useState(1);

  // ── Delete modal ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ show: true, msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }, []);

  // ── Load courses (for filter dropdown) ───────────────────────────────────
  useEffect(() => {
    listCourses(accessToken, { page_size: 100 })
      .then((d) => setCourses(d.results || []))
      .catch(() => { });
  }, [accessToken]);

  // ── Load transactions ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTransactions(accessToken, {
        search,
        course: filterCourse,
        status: filterStatus,
        payment_method: filterMethod,
        fee_type: filterFeeType,
        month: filterMonth,
        date_from: filterDateFrom,
        date_to: filterDateTo,
        page,
        page_size: 10,
      });
      setRows(data.results || []);
      setTotal(data.count || 0);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      showToast(e.message || "Failed to load transactions.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    accessToken, search, filterCourse, filterStatus, filterMethod,
    filterFeeType, filterMonth, filterDateFrom, filterDateTo, page, showToast,
  ]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  const applyFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(accessToken, deleteTarget.id);
      showToast("Transaction deleted successfully.");
      setDeleteTarget(null);
      load();
    } catch (e) {
      showToast(e.message || "Failed to delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalCollected = rows
    .filter((r) => r.status === "Paid")
    .reduce((s, r) => s + parseFloat(r.amount), 0);
  const totalPending = rows
    .filter((r) => r.status === "Pending")
    .reduce((s, r) => s + parseFloat(r.amount), 0);

  return (
    <div className="content">
      {/* ── Toast ── */}
      <div className={`toast ${toast.type} ${toast.show ? "show" : ""}`}>
        <i className={`fa-solid ${toast.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`} />
        {toast.msg}
      </div>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Transactions</h2>
          <p>Manage all fee payments and billing records.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/billing/add")}
        >
          <i className="fa-solid fa-plus" /> Add Transaction
        </button>
      </div>

      {/* ── Mini Stats ── */}
      <div className="mini-stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
        <div className="mini-card">
          <div className="mini-icon icon-green">
            <i className="fa-solid fa-money-bill-trend-up" />
          </div>
          <div>
            <div className="mini-val">Rs. {totalCollected.toLocaleString()}</div>
            <div className="mini-lbl">Collected</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-orange">
            <i className="fa-solid fa-clock-rotate-left" />
          </div>
          <div>
            <div className="mini-val">Rs. {totalPending.toLocaleString()}</div>
            <div className="mini-lbl">Pending</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-blue">
            <i className="fa-solid fa-receipt" />
          </div>
          <div>
            <div className="mini-val">{total}</div>
            <div className="mini-lbl">Total Transactions</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="table-card">
        <div className="table-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
          {/* Search */}
          <div className="table-search" style={{ width: 240 }}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Search student, course…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select className="filter-select" value={filterFeeType} onChange={applyFilter(setFilterFeeType)}>
            <option value="">All Fee Types</option>
            {FEE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>

          <select className="filter-select" value={filterCourse} onChange={applyFilter(setFilterCourse)}>
            <option value="">All Courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="filter-select" value={filterStatus} onChange={applyFilter(setFilterStatus)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>

          <select className="filter-select" value={filterMethod} onChange={applyFilter(setFilterMethod)}>
            <option value="">All Methods</option>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>

          <select className="filter-select" value={filterMonth} onChange={applyFilter(setFilterMonth)}>
            <option value="">All Months</option>
            {MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="date"
              className="filter-select"
              style={{ paddingRight: 10 }}
              value={filterDateFrom}
              onChange={applyFilter(setFilterDateFrom)}
              title="Date From"
            />
            <span style={{ fontSize: 12, color: "var(--text-soft)" }}>to</span>
            <input
              type="date"
              className="filter-select"
              style={{ paddingRight: 10 }}
              value={filterDateTo}
              onChange={applyFilter(setFilterDateTo)}
              title="Date To"
            />
          </div>

          <div className="tbl-count" style={{ marginLeft: "auto" }}>
            Showing {rows.length} of {total} records
          </div>
        </div>

        {/* ── Table ── */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Fee Type</th>
                <th>Course</th>
                <th>Month / Year</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-soft)" }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 20, marginRight: 8 }} />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <i className="fa-solid fa-receipt" />
                      <h4>No transactions found</h4>
                      <p>Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : rows.map((r, idx) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-soft)", fontSize: 12 }}>
                    {(page - 1) * 10 + idx + 1}
                  </td>
                  <td>
                    <div className="s-name">{r.student_name}</div>
                    <div className="s-id">{r.student_cnic}</div>
                  </td>
                  <td>
                    <span className={`pill ${r.fee_type === "Registration Fee" ? "pill-blue" : "pill-purple"}`}>
                      {r.fee_type}
                    </span>
                  </td>
                  <td style={{ color: r.course_name ? "var(--text-dark)" : "var(--text-soft)", fontStyle: r.course_name ? "normal" : "italic" }}>
                    {r.course_name || "—"}
                  </td>
                  <td>{r.month} {r.year}</td>
                  <td>{r.date}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>
                      Rs. {parseFloat(r.amount).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="pill pill-gray">
                      <i className={`fa-solid ${METHOD_ICON[r.payment_method] || "fa-money-bill"}`}
                        style={{ marginRight: 5, fontSize: 11 }} />
                      {r.payment_method}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${STATUS_PILL[r.status] || "pill-gray"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-group" style={{ justifyContent: "center" }}>
                      <button
                        className="act-btn act-view"
                        title="View Receipt"
                        onClick={() => navigate(`/fees/receipt/${r.id}`)}
                      >
                        <i className="fa-solid fa-receipt" />
                      </button>
                      <button
                        className="act-btn act-edit"
                        title="Edit"
                        onClick={() => navigate(`/billing/edit/${r.id}`)}
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className="act-btn act-delete"
                        title="Delete"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <i className="fa-regular fa-trash-can" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="table-footer">
          <div className="page-info">
            Showing {rows.length ? (page - 1) * 10 + 1 : 0}–{(page - 1) * 10 + rows.length} of {total}
          </div>
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <i className="fa-solid fa-chevron-left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} style={{ padding: "0 6px", color: "var(--text-soft)" }}>…</span>
                ) : (
                  <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                )
              )}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="card-icon icon-red">
                  <i className="fa-solid fa-triangle-exclamation" />
                </div>
                <h3>Delete Transaction</h3>
              </div>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.6 }}>
                Are you sure you want to delete this transaction for{" "}
                <strong>{deleteTarget.student_name}</strong>?{" "}
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <><i className="fa-solid fa-spinner fa-spin" /> Deleting…</> : <><i className="fa-solid fa-trash" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
