import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listHorseOwners,
  createHorseOwner,
  updateHorseOwner,
  deleteHorseOwner,
} from "../api/horseApi";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  cnic: "",
  address: "",
  joined_date: "",
  owner_type: "Horse Care",
};

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function HorseOwners() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // List state
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  // Modal state (Create/Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Detail Modal state
  const [viewingOwner, setViewingOwner] = useState(null);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listHorseOwners(accessToken, {
        search: debouncedSearch,
        page,
        page_size: PAGE_SIZE,
      });
      setOwners(data.results);
      setTotalPages(data.total_pages);
      setTotalCount(data.count);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, debouncedSearch, page]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditingOwner(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function openEdit(owner) {
    setEditingOwner(owner);
    setForm({
      name: owner.name || "",
      phone: owner.phone || "",
      email: owner.email || "",
      cnic: owner.cnic || "",
      address: owner.address || "",
      joined_date: owner.joined_date || "",
      owner_type: owner.owner_type || "Horse Care",
    });
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingOwner(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((fe) => ({ ...fe, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!form.cnic.trim()) errs.cnic = "CNIC is required.";
    if (!form.joined_date) errs.joined_date = "Joined date is required.";

    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (editingOwner) {
        await updateHorseOwner(accessToken, editingOwner.id, form);
      } else {
        await createHorseOwner(accessToken, form);
      }
      closeModal();
      fetchOwners();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      await deleteHorseOwner(accessToken, id);
      setDeletingId(null);
      fetchOwners();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Horse Owners</h2>
          <p>Manage private owners and their profiles.</p>
        </div>
        <div>
          <button className="btn btn-primary" id="create-owner-btn" onClick={openCreate}>
            <i className="fa-solid fa-plus"></i> Add New Owner
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
      )}

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              id="owner-search"
              type="text"
              placeholder="Search owners by name, email or address..."
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
                <th className="sortable">Owner Name <i className="fa-solid fa-sort"></i></th>
                <th>Contact Info</th>
                <th>CNIC</th>
                <th>Owner Type</th>
                <th>Joined Date</th>
                <th>Address</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading owners…
                  </td>
                </tr>
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No owners found.
                  </td>
                </tr>
              ) : (
                owners.map((owner) => (
                  <tr key={owner.id}>
                    <td>
                      <div className="rider-cell">
                        <div className="tbl-avatar" style={{ background: "var(--accent1)" }}>
                          <i className="fa-solid fa-user-tie"></i>
                        </div>
                        <div>
                          <div className="r-name">{owner.name}</div>
                          <div className="r-id">OWN-{String(owner.id).padStart(3, "0")}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "var(--text-dark)" }}>{owner.phone}</div>
                      <div style={{ fontSize: 11, color: "var(--text-soft)" }}>{owner.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{owner.cnic}</span>
                    </td>
                    <td>
                      <span className={`pill ${owner.owner_type === 'Horse Care' ? 'pill-blue' : 'pill-orange'}`} style={{ fontSize: 12 }}>
                        {owner.owner_type || "Horse Care"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{owner.joined_date}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {owner.address || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div className="action-group" style={{ justifyContent: "center" }}>
                        <button
                          className="act-btn act-view"
                          title="View Owner"
                          onClick={() => navigate(`/horse-owners/${owner.id}`)}
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>
                        <button
                          className="act-btn act-edit"
                          title="Edit Owner"
                          onClick={() => openEdit(owner)}
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button
                          className="act-btn act-delete"
                          title="Delete Owner"
                          onClick={() => setDeletingId(owner.id)}
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-footer">
          <div className="page-info">
            Showing {startEntry} to {endEntry} of {totalCount} entries
          </div>
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${p === page ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Owner Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`}>
        <div className="modal" style={{ width: 680 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-orange" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <h3>{editingOwner ? "Edit Owner" : "Register New Owner"}</h3>
            </div>
            <button className="modal-close" onClick={closeModal}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="modal-body">
            {saveError && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>
                {saveError}
              </div>
            )}
            <div className="form-grid">
              <div className="form-divider"><span>Personal Information</span></div>

              <div className="form-group span-2">
                <label className="form-label">Full Name <span>*</span></label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleFormChange}
                />
                {formErrors.name && <div className="field-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number <span>*</span></label>
                <input
                  type="tel"
                  name="phone"
                  className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
                  placeholder="+92 300 1234567"
                  value={form.phone}
                  onChange={handleFormChange}
                />
                {formErrors.phone && <div className="field-error">{formErrors.phone}</div>}
              </div>

              <div className="form-group span-2">
                <label className="form-label">Email Address <span>*</span></label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                  placeholder="owner@example.com"
                  value={form.email}
                  onChange={handleFormChange}
                />
                {formErrors.email && <div className="field-error">{formErrors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">CNIC <span>*</span></label>
                <input
                  type="text"
                  name="cnic"
                  className={`form-control ${formErrors.cnic ? "is-invalid" : ""}`}
                  placeholder="35201-1234567-9"
                  value={form.cnic}
                  onChange={handleFormChange}
                />
                {formErrors.cnic && <div className="field-error">{formErrors.cnic}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Join Date <span>*</span></label>
                <input
                  type="date"
                  name="joined_date"
                  className={`form-control ${formErrors.joined_date ? "is-invalid" : ""}`}
                  value={form.joined_date}
                  onChange={handleFormChange}
                />
                {formErrors.joined_date && <div className="field-error">{formErrors.joined_date}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Owner Type <span>*</span></label>
                <select
                  name="owner_type"
                  className="form-control"
                  value={form.owner_type}
                  onChange={handleFormChange}
                >
                  <option value="Horse Care">Horse Care</option>
                  <option value="Horse Training">Horse Training</option>
                </select>
              </div>

              <div className="form-group col-full">
                <label className="form-label">Residential Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  placeholder="Full street address..."
                  rows="2"
                  value={form.address}
                  onChange={handleFormChange}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</> : (editingOwner ? "Update Owner" : "Save Owner")}
            </button>
          </div>
        </div>
      </div>

      {/* Detail / View Modal */}
      <div className={`modal-overlay ${viewingOwner ? "open" : ""}`}>
        <div className="modal" style={{ width: 500 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-orange" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-eye"></i>
              </div>
              <h3>Owner Profile</h3>
            </div>
            <button className="modal-close" onClick={() => setViewingOwner(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body" style={{ padding: "24px" }}>
            {viewingOwner && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                  <div className="tbl-avatar" style={{ background: "var(--accent1)", width: "64px", height: "64px", fontSize: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="fa-solid fa-user-tie"></i>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", color: "var(--text-dark)" }}>{viewingOwner.name}</h4>
                    <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>OWN-{String(viewingOwner.id).padStart(3, "0")}</span>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Phone</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingOwner.phone}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Owner Type</span>
                    <span className={`pill ${viewingOwner.owner_type === 'Horse Care' ? 'pill-blue' : 'pill-orange'}`} style={{ display: "inline-block", fontSize: "12px", marginTop: "4px" }}>
                      {viewingOwner.owner_type || "Horse Care"}
                    </span>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Email</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingOwner.email}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>CNIC</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingOwner.cnic}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Joined Date</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingOwner.joined_date}</strong>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Address</span>
                  <strong style={{ fontSize: "14px", color: "var(--text-dark)", fontWeight: "normal", display: "block", marginTop: "4px" }}>
                    {viewingOwner.address || "No address provided"}
                  </strong>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setViewingOwner(null)}>Close</button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <div className={`modal-overlay ${deletingId ? "open" : ""}`}>
        <div className="modal" style={{ width: 420 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-red" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3>Delete Owner</h3>
            </div>
            <button className="modal-close" onClick={() => setDeletingId(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Are you sure you want to delete this owner? All associated horses will also be deleted. This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setDeletingId(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(deletingId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Deleting…</> : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
