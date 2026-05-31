import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listHorses,
  createHorse,
  updateHorse,
  deleteHorse,
  listHorseOwners,
} from "../api/horseApi";

const EMPTY_FORM = {
  horse_name: "",
  owner: "",
  arrival_date: "",
  height: "",
  date_of_birth: "",
  color: "",
  breed: "",
  gender: "Stallion",
};

const GENDERS = ["Stallion", "Mare", "Gelding"];
const BREEDS = ["Arabian", "Thoroughbred", "Mustang", "Friesian", "Quarter Horse", "Mixed Breed"];

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Horses() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // List state
  const [horses, setHorses] = useState([]);
  const [owners, setOwners] = useState([]); // populated for select dropdowns
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  // Modal state (Create/Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingHorse, setEditingHorse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Detail Modal state
  const [viewingHorse, setViewingHorse] = useState(null);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  // Fetch all horse owners for selection dropdown (limit 1000 to get all)
  const fetchOwners = useCallback(async () => {
    try {
      const data = await listHorseOwners(accessToken, { page_size: 1000, include_company: true });
      setOwners(data.results || []);
    } catch (e) {
      console.error("Failed to load owners for selection:", e.message);
    }
  }, [accessToken]);

  const fetchHorses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listHorses(accessToken, {
        search: debouncedSearch,
        gender: filterGender,
        page,
        page_size: PAGE_SIZE,
      });
      setHorses(data.results);
      setTotalPages(data.total_pages);
      setTotalCount(data.count);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, debouncedSearch, filterGender, page]);

  useEffect(() => {
    if (accessToken) {
      fetchHorses();
      fetchOwners();
    }
  }, [fetchHorses, fetchOwners, accessToken]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterGender]);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditingHorse(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function openEdit(horse) {
    setEditingHorse(horse);
    setForm({
      horse_name: horse.horse_name || "",
      owner: horse.owner || "",
      arrival_date: horse.arrival_date || "",
      height: horse.height || "",
      date_of_birth: horse.date_of_birth || "",
      color: horse.color || "",
      breed: horse.breed || "",
      gender: horse.gender || "Stallion",
    });
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingHorse(null);
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
    if (!form.horse_name.trim()) errs.horse_name = "Horse name is required.";
    if (!form.owner) errs.owner = "Please select a horse owner.";
    if (!form.arrival_date) errs.arrival_date = "Arrival date is required.";
    if (!form.height.trim()) errs.height = "Height is required (e.g. 15.2 hh).";
    if (!form.date_of_birth) errs.date_of_birth = "Date of birth is required.";
    if (!form.color.trim()) errs.color = "Color is required.";
    if (!form.breed.trim()) errs.breed = "Breed is required.";
    if (!form.gender) errs.gender = "Gender is required.";
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
      const payload = {
        ...form,
        owner: Number(form.owner),
      };
      if (editingHorse) {
        await updateHorse(accessToken, editingHorse.id, payload);
      } else {
        await createHorse(accessToken, payload);
      }
      closeModal();
      fetchHorses();
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
      await deleteHorse(accessToken, id);
      setDeletingId(null);
      fetchHorses();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Calculate age from date of birth
  function calculateAge(dobString) {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // Count genders for mini stats
  const stallionCount = horses.filter(h => h.gender === "Stallion").length;
  const mareCount = horses.filter(h => h.gender === "Mare").length;
  const geldingCount = horses.filter(h => h.gender === "Gelding").length;

  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Horse Directory</h2>
          <p>Manage all horses, their profiles, and owners.</p>
        </div>
        <div>
          <button className="btn btn-primary" id="add-horse-btn" onClick={openCreate}>
            <i className="fa-solid fa-plus"></i> Add New Horse
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
      )}

      {/* Mini Stats Panel */}
      <div className="mini-stats">
        <div className="mini-card">
          <div className="mini-icon icon-orange">
            <i className="fa-solid fa-horse-head"></i>
          </div>
          <div>
            <div className="mini-val">{totalCount}</div>
            <div className="mini-lbl">Total Horses</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-blue">
            <i className="fa-solid fa-mars"></i>
          </div>
          <div>
            <div className="mini-val">{stallionCount}</div>
            <div className="mini-lbl">Stallions</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-green">
            <i className="fa-solid fa-venus"></i>
          </div>
          <div>
            <div className="mini-val">{mareCount}</div>
            <div className="mini-lbl">Mares</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-red">
            <i className="fa-solid fa-neuter"></i>
          </div>
          <div>
            <div className="mini-val">{geldingCount}</div>
            <div className="mini-lbl">Geldings</div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              id="horse-search"
              type="text"
              placeholder="Search by horse name, breed, color, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            id="gender-filter"
            className="filter-select"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="">All Genders</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <div className="tbl-count">
            {loading ? "Loading…" : `Showing ${startEntry}–${endEntry} of ${totalCount}`}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="sortable">Horse Name <i className="fa-solid fa-sort"></i></th>
                <th>Breed</th>
                <th>Age & Gender</th>
                <th>Owner Details</th>
                <th>Arrival Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading horses…
                  </td>
                </tr>
              ) : horses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No horses found.
                  </td>
                </tr>
              ) : (
                horses.map((horse) => (
                  <tr key={horse.id}>
                    <td>
                      <div className="horse-cell">
                        <div className="horse-avatar">
                          <i className="fa-solid fa-horse" style={{ color: "var(--text-soft)", fontSize: 24 }}></i>
                        </div>
                        <div>
                          <div className="h-name">{horse.horse_name}</div>
                          <div className="h-id">HRS-{String(horse.id).padStart(3, "0")}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{horse.breed}</span>
                    </td>
                    <td>
                      {calculateAge(horse.date_of_birth)} yrs • {horse.gender}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "var(--text-dark)", fontWeight: 500 }}>
                        {horse.owner_name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-soft)" }}>
                        {horse.owner_email}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{horse.arrival_date}</span>
                    </td>
                    <td>
                      <div className="action-group" style={{ justifyContent: "center" }}>
                        <button
                          className="act-btn act-view"
                          title="View Horse"
                          onClick={() => navigate(`/horses/${horse.id}`)}
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>
                        <button
                          className="act-btn act-edit"
                          title="Edit Horse"
                          onClick={() => openEdit(horse)}
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button
                          className="act-btn act-delete"
                          title="Delete Horse"
                          onClick={() => setDeletingId(horse.id)}
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

      {/* Add / Edit Horse Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`}>
        <div className="modal" style={{ width: 680 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-orange" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-plus"></i>
              </div>
              <h3>{editingHorse ? "Edit Horse" : "Add New Horse"}</h3>
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
              <div className="form-divider"><span>Basic Information</span></div>

              <div className="form-group">
                <label className="form-label">Horse Name <span>*</span></label>
                <input
                  type="text"
                  name="horse_name"
                  className={`form-control ${formErrors.horse_name ? "is-invalid" : ""}`}
                  placeholder="Thunderbolt"
                  value={form.horse_name}
                  onChange={handleFormChange}
                />
                {formErrors.horse_name && <div className="field-error">{formErrors.horse_name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Breed <span>*</span></label>
                <select
                  name="breed"
                  className={`form-control ${formErrors.breed ? "is-invalid" : ""}`}
                  value={form.breed}
                  onChange={handleFormChange}
                >
                  <option value="">-- Select Breed --</option>
                  {BREEDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {formErrors.breed && <div className="field-error">{formErrors.breed}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Color <span>*</span></label>
                <input
                  type="text"
                  name="color"
                  className={`form-control ${formErrors.color ? "is-invalid" : ""}`}
                  placeholder="Black"
                  value={form.color}
                  onChange={handleFormChange}
                />
                {formErrors.color && <div className="field-error">{formErrors.color}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth <span>*</span></label>
                <input
                  type="date"
                  name="date_of_birth"
                  className={`form-control ${formErrors.date_of_birth ? "is-invalid" : ""}`}
                  value={form.date_of_birth}
                  onChange={handleFormChange}
                />
                {formErrors.date_of_birth && <div className="field-error">{formErrors.date_of_birth}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Gender <span>*</span></label>
                <select
                  name="gender"
                  className="form-control"
                  value={form.gender}
                  onChange={handleFormChange}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Height (hands/cm) <span>*</span></label>
                <input
                  type="text"
                  name="height"
                  className={`form-control ${formErrors.height ? "is-invalid" : ""}`}
                  placeholder="e.g. 15.2 hh"
                  value={form.height}
                  onChange={handleFormChange}
                />
                {formErrors.height && <div className="field-error">{formErrors.height}</div>}
              </div>

              <div className="form-divider" style={{ marginTop: 12 }}><span>Owner & Arrival</span></div>

              <div className="form-group span-2">
                <label className="form-label">Horse Owner <span>*</span></label>
                <select
                  name="owner"
                  className={`form-control ${formErrors.owner ? "is-invalid" : ""}`}
                  value={form.owner}
                  onChange={handleFormChange}
                >
                  <option value="">-- Select Owner --</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.owner_type === "Company Owned" ? "🏢 Company Owned (Internal Stable)" : `${owner.name} (${owner.email})`}
                    </option>
                  ))}
                </select>
                {formErrors.owner && <div className="field-error">{formErrors.owner}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Arrival Date <span>*</span></label>
                <input
                  type="date"
                  name="arrival_date"
                  className={`form-control ${formErrors.arrival_date ? "is-invalid" : ""}`}
                  value={form.arrival_date}
                  onChange={handleFormChange}
                />
                {formErrors.arrival_date && <div className="field-error">{formErrors.arrival_date}</div>}
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
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</> : (editingHorse ? "Update Horse" : "Save Horse")}
            </button>
          </div>
        </div>
      </div>

      {/* Detail / View Modal */}
      <div className={`modal-overlay ${viewingHorse ? "open" : ""}`}>
        <div className="modal" style={{ width: 500 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-orange" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-eye"></i>
              </div>
              <h3>Horse Profile</h3>
            </div>
            <button className="modal-close" onClick={() => setViewingHorse(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body" style={{ padding: "24px" }}>
            {viewingHorse && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                  <div className="horse-avatar" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="fa-solid fa-horse" style={{ color: "var(--accent2)", fontSize: "32px" }}></i>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", color: "var(--text-dark)" }}>{viewingHorse.horse_name}</h4>
                    <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>HRS-{String(viewingHorse.id).padStart(3, "0")}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Breed</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingHorse.breed}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Gender</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingHorse.gender}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Color</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingHorse.color}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Height</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingHorse.height}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Date of Birth</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingHorse.date_of_birth}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Arrival Date</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingHorse.arrival_date}</strong>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Owner Details</span>
                  <div style={{ marginTop: "4px" }}>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)", display: "block" }}>
                      {viewingHorse.owner_name}
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>
                      {viewingHorse.owner_email}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setViewingHorse(null)}>Close</button>
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
              <h3>Delete Horse</h3>
            </div>
            <button className="modal-close" onClick={() => setDeletingId(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Are you sure you want to delete this horse? This action cannot be undone.
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
