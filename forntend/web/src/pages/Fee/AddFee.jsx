import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createTransaction,
  updateTransaction,
  getTransaction,
} from "../../api/billingApi";
import { listStudents, listCourses } from "../../api/courseStudentApi";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const STATUSES  = ["Paid", "Pending", "Failed"];
const METHODS   = ["Cash", "Bank Transfer", "Card", "JazzCash", "EasyPaisa"];
const YEARS     = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);

const EMPTY_FORM = {
  student:              "",
  fee_type:             "Course Fee",
  course:               "",
  month:                MONTHS[new Date().getMonth()],
  year:                 String(new Date().getFullYear()),
  date:                 new Date().toISOString().split("T")[0],
  amount:               "",
  status:               "Pending",
  payment_method:       "Cash",
  card_or_account_number: "",
};

export default function AddTransaction() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();           // present when editing
  const isEdit = Boolean(id);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // ── Dropdown data ─────────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [studentSearch, setStudentSearch] = useState("");

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const toastTimer = useRef(null);
  const showToast = useCallback((msg, type = "success") => {
    setToast({ show: true, msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }, []);

  // ── Load students (search support) ───────────────────────────────────────
  useEffect(() => {
    listStudents(accessToken, { search: studentSearch, page_size: 50 })
      .then((d) => setStudents(d.results || []))
      .catch(() => {});
  }, [accessToken, studentSearch]);

  // ── Load all courses ──────────────────────────────────────────────────────
  useEffect(() => {
    listCourses(accessToken, { page_size: 100 })
      .then((d) => setCourses(d.results || []))
      .catch(() => {});
  }, [accessToken]);

  // ── Load existing transaction when editing ────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getTransaction(accessToken, id)
      .then((txn) => {
        setForm({
          student:              String(txn.student),
          fee_type:             txn.fee_type,
          course:               txn.course ? String(txn.course) : "",
          month:                txn.month,
          year:                 String(txn.year),
          date:                 txn.date,
          amount:               String(txn.amount),
          status:               txn.status,
          payment_method:       txn.payment_method,
          card_or_account_number: txn.card_or_account_number || "",
        });
      })
      .catch((e) => showToast(e.message || "Failed to load transaction.", "error"))
      .finally(() => setLoading(false));
  }, [accessToken, id, isEdit, showToast]);

  // ── Auto-fill amount from selected course ────────────────────────────────
  useEffect(() => {
    if (form.fee_type === "Course Fee" && form.course) {
      const c = courses.find((x) => String(x.id) === String(form.course));
      if (c) setForm((f) => ({ ...f, amount: String(c.fee) }));
    }
  }, [form.course, form.fee_type, courses]);

  // ── Field change helpers ──────────────────────────────────────────────────
  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((err) => ({ ...err, [field]: "" }));
  };

  const setFeeType = (val) => {
    setForm((f) => ({
      ...f,
      fee_type: val,
      course: val === "Registration Fee" ? "" : f.course,
      amount:  val === "Registration Fee" ? "" : f.amount,
    }));
    setErrors((err) => ({ ...err, fee_type: "", course: "" }));
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.student) e.student = "Student is required.";
    if (!form.fee_type) e.fee_type = "Fee type is required.";
    if (form.fee_type === "Course Fee" && !form.course) e.course = "Course is required for Course Fee.";
    if (!form.month) e.month = "Month is required.";
    if (!form.year) e.year = "Year is required.";
    if (!form.date) e.date = "Date is required.";
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = "Amount must be greater than 0.";
    if (!form.status) e.status = "Status is required.";
    if (!form.payment_method) e.payment_method = "Payment method is required.";
    if (form.payment_method !== "Cash" && !form.card_or_account_number) {
      e.card_or_account_number = "Account / card number is required for non-cash methods.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      student:              parseInt(form.student, 10),
      fee_type:             form.fee_type,
      course:               form.fee_type === "Course Fee" ? parseInt(form.course, 10) : null,
      month:                form.month,
      year:                 parseInt(form.year, 10),
      date:                 form.date,
      amount:               form.amount,
      status:               form.status,
      payment_method:       form.payment_method,
      card_or_account_number: form.card_or_account_number,
    };

    try {
      if (isEdit) {
        await updateTransaction(accessToken, id, payload);
        showToast("Transaction updated successfully.");
      } else {
        await createTransaction(accessToken, payload);
        showToast("Transaction created successfully.");
        setForm(EMPTY_FORM);
        setErrors({});
      }
      setTimeout(() => navigate("/fees/records"), 900);
    } catch (err) {
      const msg = err.message || "Failed to save transaction.";
      showToast(msg, "error");
      if (msg.includes("Registration Fee")) {
        setErrors({ fee_type: msg });
      } else if (msg.includes("transaction already exists")) {
        setErrors({ course: msg });
      } else if (msg.includes("Account / card number")) {
        setErrors({ card_or_account_number: msg });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="content" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
        <div style={{ textAlign:"center", color:"var(--text-soft)" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize:28, marginBottom:14, display:"block" }} />
          Loading transaction…
        </div>
      </div>
    );
  }

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
          <h2>{isEdit ? "Edit Transaction" : "New Transaction"}</h2>
          <p>{isEdit ? "Update the billing record below." : "Record a new fee payment for a student."}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate("/fees/records")}>
          <i className="fa-solid fa-arrow-left" /> Back to Records
        </button>
      </div>

      <div className="card" style={{ maxWidth: 860, margin: "0 auto" }}>
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon icon-green">
              <i className="fa-solid fa-money-bill-wave" />
            </div>
            <div>
              <div className="card-title">{isEdit ? "Edit Transaction" : "Transaction Details"}</div>
              <div className="card-sub">Fill in the billing information below</div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Fee Type Selector ── */}
            <div className="form-divider"><span>Fee Type</span></div>
            <div style={{ display:"flex", gap:14, marginBottom:24 }}>
              {["Registration Fee", "Course Fee"].map((ft) => (
                <label
                  key={ft}
                  style={{
                    flex:1, display:"flex", alignItems:"center", gap:10,
                    padding:"14px 18px",
                    border:`1.5px solid ${form.fee_type === ft ? "var(--active)" : "var(--border)"}`,
                    borderRadius:12, cursor:"pointer",
                    background: form.fee_type === ft ? "#f0f4ff" : "#fff",
                    transition:"all .2s",
                  }}
                  onClick={() => setFeeType(ft)}
                >
                  <div style={{
                    width:18, height:18, borderRadius:"50%",
                    border:`5px solid ${form.fee_type === ft ? "var(--active)" : "var(--border)"}`,
                    background:"#fff", flexShrink:0,
                  }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-dark)" }}>{ft}</div>
                    <div style={{ fontSize:11, color:"var(--text-soft)" }}>
                      {ft === "Course Fee" ? "Linked to a specific course" : "One-time registration charge"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.fee_type && <div className="field-error" style={{ marginTop:-18, marginBottom:14 }}>{errors.fee_type}</div>}

            <div className="form-grid">
              {/* ── Student ── */}
              <div className="form-group span-3">
                <label className="form-label">Student <span>*</span></label>
                <select
                  className={`form-control ${errors.student ? "is-invalid" : ""}`}
                  value={form.student}
                  onChange={set("student")}
                >
                  <option value="">— Select Student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.cnic}
                    </option>
                  ))}
                </select>
                {errors.student && <div className="field-error">{errors.student}</div>}
                <div style={{ marginTop:6 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type to search students…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{ fontSize:12, padding:"6px 10px" }}
                  />
                </div>
              </div>

              {/* ── Course (shown only for Course Fee) ── */}
              {form.fee_type === "Course Fee" && (
                <div className="form-group span-3">
                  <label className="form-label">Course <span>*</span></label>
                  <select
                    className={`form-control ${errors.course ? "is-invalid" : ""}`}
                    value={form.course}
                    onChange={set("course")}
                  >
                    <option value="">— Select Course —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Rs. {parseFloat(c.fee).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {errors.course && <div className="field-error">{errors.course}</div>}
                  {form.course && (
                    <div style={{ fontSize:12, color:"var(--accent2)", marginTop:4, fontWeight:600 }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight:5 }} />
                      Course fee auto-filled from course record.
                    </div>
                  )}
                </div>
              )}

              {/* ── Month ── */}
              <div className="form-group">
                <label className="form-label">Fee Month <span>*</span></label>
                <select
                  className={`form-control ${errors.month ? "is-invalid" : ""}`}
                  value={form.month}
                  onChange={set("month")}
                >
                  {MONTHS.map((m) => <option key={m}>{m}</option>)}
                </select>
                {errors.month && <div className="field-error">{errors.month}</div>}
              </div>

              {/* ── Year ── */}
              <div className="form-group">
                <label className="form-label">Year <span>*</span></label>
                <select
                  className={`form-control ${errors.year ? "is-invalid" : ""}`}
                  value={form.year}
                  onChange={set("year")}
                >
                  {YEARS.map((y) => <option key={y}>{y}</option>)}
                </select>
                {errors.year && <div className="field-error">{errors.year}</div>}
              </div>

              {/* ── Date ── */}
              <div className="form-group">
                <label className="form-label">Payment Date <span>*</span></label>
                <input
                  type="date"
                  className={`form-control ${errors.date ? "is-invalid" : ""}`}
                  value={form.date}
                  onChange={set("date")}
                />
                {errors.date && <div className="field-error">{errors.date}</div>}
              </div>

              {/* ── Amount ── */}
              <div className="form-group">
                <label className="form-label">Amount (Rs.) <span>*</span></label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                  placeholder="0.00"
                  value={form.amount}
                  onChange={set("amount")}
                />
                {errors.amount && <div className="field-error">{errors.amount}</div>}
              </div>

              {/* ── Status ── */}
              <div className="form-group">
                <label className="form-label">Status <span>*</span></label>
                <select
                  className={`form-control ${errors.status ? "is-invalid" : ""}`}
                  value={form.status}
                  onChange={set("status")}
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                {errors.status && <div className="field-error">{errors.status}</div>}
              </div>

              {/* ── Divider ── */}
              <div className="form-divider">
                <span>Payment Method</span>
              </div>

              {/* ── Payment Method ── */}
              <div className="form-group span-3">
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {METHODS.map((m) => (
                    <label
                      key={m}
                      style={{
                        display:"flex", alignItems:"center", gap:8,
                        padding:"10px 16px",
                        border:`1.5px solid ${form.payment_method === m ? "var(--accent2)" : "var(--border)"}`,
                        borderRadius:10, cursor:"pointer",
                        background: form.payment_method === m ? "#f0fdf4" : "#fff",
                        flex:"1 1 120px", minWidth:120,
                        transition:"all .2s",
                      }}
                      onClick={() => { setForm((f) => ({ ...f, payment_method: m })); setErrors((e) => ({ ...e, payment_method:"" })); }}
                    >
                      <div style={{
                        width:16, height:16, borderRadius:"50%",
                        border:`4px solid ${form.payment_method === m ? "var(--accent2)" : "var(--border)"}`,
                        background:"#fff",
                      }} />
                      <span style={{ fontSize:13, fontWeight:600, color:"var(--text-dark)" }}>{m}</span>
                    </label>
                  ))}
                </div>
                {errors.payment_method && <div className="field-error">{errors.payment_method}</div>}
              </div>

              {/* ── Card / Account Number ── */}
              {form.payment_method !== "Cash" && (
                <div className="form-group span-3">
                  <label className="form-label">
                    {form.payment_method === "Card" ? "Card Number" : "Account Number"} <span>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.card_or_account_number ? "is-invalid" : ""}`}
                    placeholder={form.payment_method === "Card" ? "XXXX-XXXX-XXXX-XXXX" : "Account number"}
                    value={form.card_or_account_number}
                    onChange={set("card_or_account_number")}
                  />
                  {errors.card_or_account_number && (
                    <div className="field-error">{errors.card_or_account_number}</div>
                  )}
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="form-actions" style={{ marginTop:24, paddingTop:24, borderTop:"1px solid var(--border)" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/fees/records")}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                  : <><i className="fa-solid fa-check" /> {isEdit ? "Update Transaction" : "Save Transaction"}</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
