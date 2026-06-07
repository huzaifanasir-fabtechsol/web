import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTransaction } from "../../api/billingApi";
import { getStudent } from "../../api/courseStudentApi";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function pad(n) { return String(n).padStart(4, "0"); }

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });
}

const STATUS_COLOR = {
  Paid:    { bg: "#dcfce7", color: "#15803d", label: "PAID" },
  Pending: { bg: "#fff7ed", color: "#c2410c", label: "PENDING" },
  Partial: { bg: "#eff6ff", color: "#1d4ed8", label: "PARTIAL" },
  Failed:  { bg: "#fee2e2", color: "#dc2626", label: "FAILED" },
};

const METHOD_ICON = {
  Cash:            "fa-money-bill",
  "Bank Transfer": "fa-building-columns",
  Card:            "fa-credit-card",
  JazzCash:        "fa-mobile-screen",
  EasyPaisa:       "fa-wallet",
};

/* ─── print styles injected via <style> ──────────────────────────────────── */
const PRINT_CSS = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
    body * { visibility: hidden; }
    .sidebar, .topbar, .hide-on-print { display: none !important; }
    .main { margin: 0 !important; padding: 0 !important; }
    .content { padding: 0 !important; }
    .receipt-printable, .receipt-printable * {
      visibility: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .receipt-printable {
      position: absolute !important;
      left: 14mm !important;
      top: 10mm !important;
      right: 14mm !important;
      width: auto !important;
      height: auto !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
    }
    .receipt-watermark { display: block !important; }
  }
`;

/* ─── component ───────────────────────────────────────────────────────────── */
export default function Receipt() {
  const { id } = useParams();
  const { accessToken } = useAuth();

  const [txn,     setTxn]     = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  /* fetch transaction → then fetch student */
  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      const t = await getTransaction(accessToken, id);
      setTxn(t);
      if (t.student) {
        const s = await getStudent(accessToken, t.student);
        setStudent(s);
      }
    } catch (e) {
      setError(e.message || "Failed to load receipt.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => window.print();

  /* ── loading / error states ── */
  if (loading) {
    return (
      <div className="content" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
        <div style={{ textAlign:"center", color:"var(--text-soft)" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize:28, marginBottom:14, display:"block" }} />
          Loading receipt…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="alert alert-error">
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
        <Link to="/fees/records" className="btn btn-outline" style={{ marginTop:14 }}>
          <i className="fa-solid fa-arrow-left" /> Back to Records
        </Link>
      </div>
    );
  }

  /* ── derived display values ── */
  const receiptNo    = txn  ? `REC-${pad(txn.id)}`  : "REC-XXXX";
  const statusStyle  = txn  ? (STATUS_COLOR[txn.status] || { bg:"#f3f4f6", color:"#6b7280", label: txn?.status }) : {};
  const showAcctNo   = txn  && txn.payment_method !== "Cash" && txn.card_or_account_number;
  const showCourse   = txn  && txn.fee_type === "Course Fee";
  const amountFormatted = txn
    ? `Rs. ${parseFloat(txn.amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`
    : "Rs. —";

  return (
    <div className="content">
      <style>{PRINT_CSS}</style>

      {/* ── Page Header (hidden on print) ── */}
      <div className="page-header hide-on-print">
        <div className="page-header-left">
          <h2>Payment Receipt</h2>
          <p>{id ? `Receipt ${receiptNo}` : "Preview — no transaction loaded"}</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Link to="/fees/records" className="btn btn-outline">
            <i className="fa-solid fa-arrow-left" /> Back
          </Link>
          <button className="btn btn-primary" onClick={handlePrint}>
            <i className="fa-solid fa-print" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PRINTABLE RECEIPT CARD
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className="receipt-printable"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,.1)",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
        }}
      >
        {/* ── Watermark (visible only in print) ── */}
        <div
          className="receipt-watermark"
          style={{
            display: "none",
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%) rotate(-30deg)",
            fontSize: 90, fontWeight: 900, color: "rgba(0,0,0,.04)",
            pointerEvents: "none", whiteSpace: "nowrap", zIndex: 0,
            textTransform: "uppercase", letterSpacing: 8,
          }}
        >
          {statusStyle.label || "RECEIPT"}
        </div>

        {/* ───────────────────────────────────────────
            HEADER BANNER
        ─────────────────────────────────────────── */}
        <div style={{
          position: "relative",
          padding: "28px 36px",
          overflow: "hidden",
        }}>
          {/* Background Image (safe for printing as it's a real img tag) */}
          <img
            src="/login-bg.png"
            alt="Receipt Header Background"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
            }}
          />
          {/* Dark / Gold Gradient Overlay to ensure text legibility */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(26, 21, 6, 0.9) 0%, rgba(61, 46, 4, 0.85) 40%, rgb(92 66 16 / 0%) 70%, rgba(26, 21, 6, 0.9) 100%)",
            zIndex: 1,
          }} />

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", position:"relative", zIndex:2 }}>
            {/* School Identity */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
                <div style={{
                  width:52, height:52, borderRadius:12,
                  background:"linear-gradient(135deg,#f97316,#d97706)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:24, color:"#fff", flexShrink:0,
                  boxShadow:"0 4px 12px rgba(249,115,22,.4)",
                }}>
                  <i className="fa-solid fa-horse" />
                </div>
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:"#f6e05e", letterSpacing:"0.04em", textTransform:"uppercase", lineHeight:1.1 }}>
                    Abu Ali
                  </div>
                  <div style={{ fontSize:20, fontWeight:900, color:"#f6e05e", letterSpacing:"0.04em", textTransform:"uppercase", lineHeight:1.1 }}>
                    Riding School
                  </div>
                </div>
              </div>
              <div style={{ fontSize:11.5, color:"rgba(255,255,255,.65)", lineHeight:1.8 }}>
                <i className="fa-solid fa-location-dot" style={{ marginRight:5, color:"#f97316" }} />
                Aulakh Awan, Near City Villas, Imtiaz Mall, Sialkot<br />
                <i className="fa-solid fa-phone" style={{ marginRight:5, color:"#f97316" }} />
                0313-3313131 &nbsp;|&nbsp; 0310-8025673
              </div>
            </div>

            {/* Receipt badge */}
            <div style={{ textAlign:"right" }}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,.12)", borderRadius:10,
                padding:"6px 14px", marginBottom:10,
              }}>
                <i className="fa-solid fa-receipt" style={{ color:"#f97316", fontSize:14 }} />
                <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.9)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                  Payment Receipt
                </span>
              </div>
              <div style={{ fontSize:28, fontWeight:900, color:"#fff", letterSpacing:"2px", lineHeight:1 }}>
                {receiptNo}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginTop:6 }}>
                {txn ? formatDate(txn.date) : "—"}
              </div>
              {/* Status badge */}
              {txn && (
                <div style={{
                  display:"inline-block", marginTop:10,
                  padding:"5px 16px", borderRadius:20,
                  background: statusStyle.bg, color: statusStyle.color,
                  fontWeight:800, fontSize:12, letterSpacing:"0.06em",
                }}>
                  {statusStyle.label}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Orange accent bar ── */}
        <div style={{ height:4, background:"linear-gradient(90deg,#f97316,#d97706,#f97316)" }} />

        {/* ───────────────────────────────────────────
            BODY
        ─────────────────────────────────────────── */}
        <div style={{ padding:"28px 36px" }}>

          {/* ── Section: Student Information ── */}
          <SectionHeading icon="fa-user-graduate" label="Student Information" />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 36px", marginBottom:24 }}>
            <ReceiptField label="Full Name"               value={student?.name || txn?.student_name || "—"} />
            <ReceiptField label="Age"                     value={student ? `${student.age} years` : "—"} />
            <ReceiptField label="Contact Number"          value={student?.phone_number || "—"} />
            <ReceiptField label="CNIC Number"             value={student?.cnic || txn?.student_cnic || "—"} />
            <ReceiptField label="Riding Experience"       value={student?.experience_level || "—"} />
            <ReceiptField label="Blood Group"             value={student?.blood_group || "—"} />
            <ReceiptField label="Guardian Name"           value={student?.guardian_name || "—"} />
            <ReceiptField label="Guardian Contact"        value={student?.guardian_contact || "—"} />
          </div>

          {/* ── Section: Payment Details ── */}
          <SectionHeading icon="fa-money-bill-wave" label="Payment Details" />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 36px", marginBottom:24 }}>
            {/* Payment Method */}
            <div style={{ padding:"10px 0", borderBottom:"1px solid #f0f0f0" }}>
              <div style={{ fontSize:10.5, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
                Payment Method
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:600, color:"#1a1f2e" }}>
                <span style={{
                  width:28, height:28, borderRadius:8,
                  background:"#fff7ed", color:"#f97316",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
                }}>
                  <i className={`fa-solid ${METHOD_ICON[txn?.payment_method] || "fa-money-bill"}`} />
                </span>
                {txn?.payment_method || "—"}
              </div>
            </div>

            {/* Account / Card Number — only if non-cash */}
            {showAcctNo ? (
              <ReceiptField
                label={txn.payment_method === "Card" ? "Card Number" : "Account Number"}
                value={txn.card_or_account_number}
              />
            ) : (
              <div style={{ padding:"10px 0", borderBottom:"1px solid #f0f0f0" }}>
                <div style={{ fontSize:10.5, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
                  Account / Card No.
                </div>
                <div style={{ fontSize:13, color:"#9ca3af", fontStyle:"italic" }}>N/A (Cash)</div>
              </div>
            )}

            {/* Transaction Type */}
            <ReceiptField
              label="Transaction Type"
              value={txn?.fee_type || "—"}
              pill
              pillColor={txn?.fee_type === "Registration Fee" ? "#eff6ff" : "#faf5ff"}
              pillText={txn?.fee_type === "Registration Fee" ? "#1d4ed8" : "#7e22ce"}
            />

            {/* Course Name — only for Course Fee */}
            {showCourse ? (
              <ReceiptField label="Course Name" value={txn?.course_detail?.name || txn?.course_name || "—"} />
            ) : (
              <ReceiptField label="Course Name" value="N/A" muted />
            )}

            {/* Period */}
            <ReceiptField
              label="Fee Period"
              value={txn ? `${txn.month} ${txn.year}` : "—"}
            />

            {/* Payment Date */}
            <ReceiptField label="Payment Date" value={txn ? formatDate(txn.date) : "—"} />
          </div>

          {/* ── Amount Summary Box ── */}
          <div style={{
            background:"linear-gradient(135deg,#1a1f2e,#2d3548)",
            borderRadius:14, padding:"20px 28px",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:28,
          }}>
            <div>
              <div style={{ fontSize:11.5, color:"rgba(255,255,255,.55)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>
                Amount Paid
              </div>
              <div style={{ fontSize:34, fontWeight:900, color:"#f6e05e", lineHeight:1 }}>
                {amountFormatted}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                Payment Status
              </div>
              <div style={{
                display:"inline-block", padding:"8px 20px", borderRadius:20,
                background: statusStyle.bg, color: statusStyle.color,
                fontWeight:900, fontSize:14, letterSpacing:"0.04em",
              }}>
                {statusStyle.label || "—"}
              </div>
            </div>
          </div>

          {/* ── Signature Section ── */}
          <SectionHeading icon="fa-signature" label="Signatures" />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 60px", marginBottom:28, marginTop:8 }}>
            <div>
              <div style={{ borderTop:"1.5px solid #1a1f2e", paddingTop:10, marginTop:50 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#1a1f2e" }}>Authorised Signature</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>Abu Ali Riding School</div>
              </div>
            </div>
            <div>
              <div style={{ borderTop:"1.5px solid #1a1f2e", paddingTop:10, marginTop:50 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#1a1f2e" }}>Applicant's Signature</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>
                  {student?.name || txn?.student_name || "Student"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <div style={{
            background:"#fffbeb",
            border:"1px solid #fde68a",
            borderRadius:10,
            padding:"14px 18px",
            marginBottom:24,
          }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color:"#d97706", fontSize:14, marginTop:2, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:11.5, fontWeight:700, color:"#92400e", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Disclaimer / Liability Notice
                </div>
                <p style={{ fontSize:11.5, color:"#78350f", lineHeight:1.7, margin:0 }}>
                  In case of any injury or accident during riding activities, <strong>Abu Ali Riding School is not responsible</strong>.
                  Students/guardians participate at their own risk. This receipt serves as a formal record of
                  payment only and does not constitute insurance or liability coverage. All fees paid are
                  non-refundable unless otherwise agreed in writing by the school management.
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            borderTop:"1px solid #e5e7eb",
            paddingTop:18,
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <div style={{ fontSize:11, color:"#9ca3af", lineHeight:1.6 }}>
              <strong style={{ color:"#4b5563" }}>Abu Ali Riding School</strong><br />
              Aulakh Awan, Near City Villas, Imtiaz Mall, Sialkot<br />
              0313-3313131 | 0310-8025673
            </div>
            <div style={{ textAlign:"right", fontSize:11, color:"#9ca3af" }}>
              <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>
                Receipt Number
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:"#1a1f2e" }}>{receiptNo}</div>
              <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>
                Generated: {new Date().toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" })}
              </div>
            </div>
          </div>

        </div>{/* end body */}
      </div>{/* end receipt card */}

      {/* ── Bottom action bar (hidden on print) ── */}
      <div className="hide-on-print" style={{
        maxWidth:760, margin:"18px auto 0",
        display:"flex", justifyContent:"center", gap:12,
      }}>
        <Link to="/fees/records" className="btn btn-outline">
          <i className="fa-solid fa-arrow-left" /> Back to Records
        </Link>
        <button className="btn btn-primary" onClick={handlePrint}>
          <i className="fa-solid fa-print" /> Print Receipt
        </button>
        <button
          className="btn btn-outline"
          style={{ borderColor:"#d97706", color:"#d97706" }}
          onClick={handlePrint}
          title="Print then choose 'Save as PDF' in the print dialog"
        >
          <i className="fa-solid fa-file-pdf" /> Save as PDF
        </button>
      </div>
    </div>
  );
}

/* ─── sub-components ──────────────────────────────────────────────────────── */

function SectionHeading({ icon, label }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      marginBottom:14, paddingBottom:10,
      borderBottom:"2px solid #f0f0f0",
    }}>
      <div style={{
        width:30, height:30, borderRadius:8,
        background:"linear-gradient(135deg,#f97316,#d97706)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontSize:13,
      }}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:"#1a1f2e", textTransform:"uppercase", letterSpacing:"0.06em" }}>
        {label}
      </span>
    </div>
  );
}

function ReceiptField({ label, value, pill, pillColor, pillText, muted }) {
  return (
    <div style={{ padding:"10px 0", borderBottom:"1px solid #f0f0f0" }}>
      <div style={{ fontSize:10.5, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
        {label}
      </div>
      {pill ? (
        <span style={{
          display:"inline-flex", alignItems:"center", gap:4,
          padding:"3px 12px", borderRadius:20,
          background: pillColor, color: pillText,
          fontSize:12.5, fontWeight:700,
        }}>
          {value}
        </span>
      ) : (
        <div style={{ fontSize:13.5, fontWeight:muted ? 400 : 600, color: muted ? "#9ca3af" : "#1a1f2e" }}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}
