import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUpdateStudentStatus,
} from "../api/courseStudentApi";

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GUARDIAN_RELATIONS = ["Father", "Mother", "Brother", "Sister", "Uncle", "Aunt", "Guardian"];

const EMPTY_FORM = {
  name: "", age: "", blood_group: "", phone_number: "",
  experience_level: "Beginner", cnic: "", admission_date: "",
  address: "", is_active: true,
  guardian_name: "", guardian_relation: "", guardian_contact: "", guardian_cnic: "",
};

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Students() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk selection state
  const [selected, setSelected] = useState(new Set());
  const [confirmBulkStatus, setConfirmBulkStatus] = useState(null); // null | true | false
  const [bulkLoading, setBulkLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ msg: "", type: "", show: false });
  const toastTimerRef = useRef();
  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, type, show: true });
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      3200
    );
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listStudents(accessToken, {
        search: debouncedSearch,
        is_active: filterActive,
        page,
        page_size: PAGE_SIZE,
      });
      setStudents(data.results);
      setTotalPages(data.total_pages);
      setTotalCount(data.count);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, debouncedSearch, filterActive, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [debouncedSearch, filterActive]);

  function openCreate() {
    setEditingStudent(null);
    setForm(EMPTY_FORM);
    setPictureFile(null);
    setPicturePreview(null);
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function openEdit(student) {
    setEditingStudent(student);
    setForm({
      name: student.name || "",
      age: student.age || "",
      blood_group: student.blood_group || "",
      phone_number: student.phone_number || "",
      experience_level: student.experience_level || "Beginner",
      cnic: student.cnic || "",
      admission_date: student.admission_date || "",
      address: student.address || "",
      is_active: student.is_active ?? true,
      guardian_name: student.guardian_name || "",
      guardian_relation: student.guardian_relation || "",
      guardian_contact: student.guardian_contact || "",
      guardian_cnic: student.guardian_cnic || "",
    });
    setPictureFile(null);
    setPicturePreview(student.profile_picture || null);
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingStudent(null);
    setForm(EMPTY_FORM);
    setPictureFile(null);
    setPicturePreview(null);
    setFormErrors({});
    setSaveError("");
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setFormErrors((fe) => ({ ...fe, [name]: "" }));
  }

  function handlePictureChange(e) {
    const file = e.target.files[0];
    if (file) {
      setPictureFile(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.age || isNaN(form.age) || Number(form.age) < 1) errs.age = "Valid age required.";
    if (!form.phone_number.trim()) errs.phone_number = "Phone number is required.";
    if (!form.cnic.trim()) errs.cnic = "CNIC is required.";
    if (!form.admission_date) errs.admission_date = "Admission date is required.";
    if (!form.guardian_name.trim()) errs.guardian_name = "Guardian name is required.";
    if (!form.guardian_contact.trim()) errs.guardian_contact = "Guardian contact is required.";
    if (!form.guardian_cnic.trim()) errs.guardian_cnic = "Guardian CNIC is required.";
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    setSaveError("");
    try {
      let payload;
      if (pictureFile) {
        payload = new FormData();
        Object.entries(form).forEach(([k, v]) => payload.append(k, v));
        payload.append("profile_picture", pictureFile);
      } else {
        payload = { ...form, age: Number(form.age) };
      }
      if (editingStudent) {
        await updateStudent(accessToken, editingStudent.id, payload);
      } else {
        await createStudent(accessToken, payload);
      }
      closeModal();
      fetchStudents();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      await deleteStudent(accessToken, id);
      setDeletingId(null);
      fetchStudents();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Bulk selection handlers
  function toggleSelect(studentId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.id)));
    }
  }

  async function handleBulkStatus(isActive) {
    setBulkLoading(true);
    try {
      const res = await bulkUpdateStudentStatus(accessToken, [...selected], isActive);
      showToast(res.detail || `${res.updated} student(s) updated.`, "success");
      setSelected(new Set());
      setConfirmBulkStatus(null);
      fetchStudents();
    } catch (e) {
      showToast(e.message || "Failed to update students.", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalCount);
  const activeCount = students.filter((s) => s.is_active).length;

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Student Management</h2>
          <p>Manage all registered students, their profiles and guardian information.</p>
        </div>
        <div>
          <button className="btn btn-primary" id="add-student-btn" onClick={openCreate}>
            <i className="fa-solid fa-plus"></i> Add New Student
          </button>
        </div>
      </div>

      <div className="mini-stats">
        <div className="mini-card">
          <div className="mini-icon icon-blue"><i className="fa-solid fa-users"></i></div>
          <div><div className="mini-val">{totalCount}</div><div className="mini-lbl">Total Students</div></div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-green"><i className="fa-solid fa-user-check"></i></div>
          <div><div className="mini-val">{students.filter(s => s.is_active).length}</div><div className="mini-lbl">Active</div></div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-orange"><i className="fa-solid fa-user-clock"></i></div>
          <div><div className="mini-val">{students.filter(s => !s.is_active).length}</div><div className="mini-lbl">Inactive</div></div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-purple"><i className="fa-solid fa-book-open"></i></div>
          <div><div className="mini-val">{totalPages}</div><div className="mini-lbl">Total Pages</div></div>
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
              id="student-search"
              type="text"
              placeholder="Search by name, phone, CNIC, guardian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            id="student-filter-active"
            className="filter-select"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
          >
            <option value="">All Students</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <div className="tbl-count">
            {loading ? "Loading…" : `Showing ${startEntry}–${endEntry} of ${totalCount}`}
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selected.size > 0 && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", margin: "0 0 0 0",
              background: "linear-gradient(135deg, #eff6ff, #f0f9ff)",
              borderTop: "1px solid #bfdbfe", borderBottom: "1px solid #bfdbfe",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: "#1e40af" }}>
              <i className="fa-solid fa-check-double" style={{ marginRight: 6 }} />
              {selected.size} student{selected.size !== 1 ? "s" : ""} selected
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{ fontSize: 12, background: "#16a34a", color: "#fff", border: "none" }}
                onClick={() => setConfirmBulkStatus(true)}
                disabled={bulkLoading}
              >
                <i className="fa-solid fa-user-check" /> Mark Active
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ fontSize: 12, borderColor: "#d97706", color: "#d97706" }}
                onClick={() => setConfirmBulkStatus(false)}
                disabled={bulkLoading}
              >
                <i className="fa-solid fa-user-clock" /> Mark Inactive
              </button>
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
                <th className="sortable">Student <i className="fa-solid fa-sort"></i></th>
                <th>Age</th>
                <th>Contact</th>
                <th>CNIC</th>
                <th>Experience</th>
                <th>Guardian</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading students…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} style={{ background: selected.has(student.id) ? "#eff6ff" : "" }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        style={{ accentColor: "#3b82f6", cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <div className="student-cell">
                        <div className="s-avatar">
                          {student.profile_picture ? (
                            <img src={student.profile_picture} alt={student.name} />
                          ) : (
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                              alt={student.name}
                            />
                          )}
                        </div>
                        <div>
                          <div className="s-name">{student.name}</div>
                          <div className="s-id">{student.admission_date}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.age} yrs</td>
                    <td>{student.phone_number}</td>
                    <td style={{ fontSize: 12 }}>{student.cnic}</td>
                    <td>
                      <span className={`pill ${student.experience_level === "Advanced" ? "pill-purple" : student.experience_level === "Intermediate" ? "pill-orange" : "pill-blue"}`}>
                        {student.experience_level}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{student.guardian_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{student.guardian_contact}</div>
                    </td>
                    <td>
                      <span className={`pill ${student.is_active ? "pill-green" : "pill-gray"}`}>
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-group" style={{ justifyContent: "center" }}>
                        <button id={`view-student-${student.id}`} className="act-btn act-view" title="View Details" onClick={() => navigate(`/students/${student.id}`)}>
                          <i className="fa-regular fa-eye"></i>
                        </button>
                        <button id={`edit-student-${student.id}`} className="act-btn act-edit" title="Edit" onClick={() => openEdit(student)}>
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button id={`delete-student-${student.id}`} className="act-btn act-delete" title="Delete" onClick={() => setDeletingId(student.id)}>
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

        <div className="table-footer">
          <div className="page-info">Showing {startEntry} to {endEntry} of {totalCount} entries</div>
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`}>
        <div className="modal" style={{ width: 720 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-blue" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <h3>{editingStudent ? "Edit Student" : "Register New Student"}</h3>
            </div>
            <button className="modal-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
          </div>

          <div className="modal-body">
            {saveError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{saveError}</div>}

            {/* Photo Upload */}
            <div className="upload-zone">
              <div className="upload-preview" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer" }}>
                {picturePreview ? (
                  <img src={picturePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <i className="fa-solid fa-camera ph-icon"></i>
                )}
              </div>
              <div className="upload-info">
                <h4>Student Photo</h4>
                <p>JPG, PNG or WEBP. Max size 2MB.</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>Select Image</button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePictureChange} />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-divider"><span>Personal Information</span></div>

              <div className="form-group span-2">
                <label className="form-label">Full Name <span>*</span></label>
                <input id="student-name-input" type="text" name="name" className={`form-control ${formErrors.name ? "is-invalid" : ""}`} placeholder="Full name" value={form.name} onChange={handleFormChange} />
                {formErrors.name && <div className="field-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Age <span>*</span></label>
                <input type="number" name="age" min="1" className={`form-control ${formErrors.age ? "is-invalid" : ""}`} placeholder="18" value={form.age} onChange={handleFormChange} />
                {formErrors.age && <div className="field-error">{formErrors.age}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="blood_group" className="form-control" value={form.blood_group} onChange={handleFormChange}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number <span>*</span></label>
                <input type="tel" name="phone_number" className={`form-control ${formErrors.phone_number ? "is-invalid" : ""}`} placeholder="+92 300 0000000" value={form.phone_number} onChange={handleFormChange} />
                {formErrors.phone_number && <div className="field-error">{formErrors.phone_number}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">CNIC <span>*</span></label>
                <input type="text" name="cnic" className={`form-control ${formErrors.cnic ? "is-invalid" : ""}`} placeholder="XXXXX-XXXXXXX-X" value={form.cnic} onChange={handleFormChange} />
                {formErrors.cnic && <div className="field-error">{formErrors.cnic}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select name="experience_level" className="form-control" value={form.experience_level} onChange={handleFormChange}>
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Admission Date <span>*</span></label>
                <input type="date" name="admission_date" className={`form-control ${formErrors.admission_date ? "is-invalid" : ""}`} value={form.admission_date} onChange={handleFormChange} />
                {formErrors.admission_date && <div className="field-error">{formErrors.admission_date}</div>}
              </div>

              <div className="form-group col-full">
                <label className="form-label">Address</label>
                <textarea name="address" className="form-control" rows="2" placeholder="Residential address" value={form.address} onChange={handleFormChange}></textarea>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleFormChange} />
                  Active Student
                </label>
              </div>

              <div className="form-divider" style={{ marginTop: 12 }}><span>Guardian Information</span></div>

              <div className="form-group">
                <label className="form-label">Guardian Name <span>*</span></label>
                <input type="text" name="guardian_name" className={`form-control ${formErrors.guardian_name ? "is-invalid" : ""}`} placeholder="Guardian full name" value={form.guardian_name} onChange={handleFormChange} />
                {formErrors.guardian_name && <div className="field-error">{formErrors.guardian_name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Relation</label>
                <select name="guardian_relation" className="form-control" value={form.guardian_relation} onChange={handleFormChange}>
                  <option value="">Select</option>
                  {GUARDIAN_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Guardian Contact <span>*</span></label>
                <input type="tel" name="guardian_contact" className={`form-control ${formErrors.guardian_contact ? "is-invalid" : ""}`} placeholder="+92 300 0000000" value={form.guardian_contact} onChange={handleFormChange} />
                {formErrors.guardian_contact && <div className="field-error">{formErrors.guardian_contact}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Guardian CNIC <span>*</span></label>
                <input type="text" name="guardian_cnic" className={`form-control ${formErrors.guardian_cnic ? "is-invalid" : ""}`} placeholder="XXXXX-XXXXXXX-X" value={form.guardian_cnic} onChange={handleFormChange} />
                {formErrors.guardian_cnic && <div className="field-error">{formErrors.guardian_cnic}</div>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Cancel</button>
            <button id="save-student-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</> : (editingStudent ? "Update Student" : "Save Student")}
            </button>
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
              <h3>Delete Student</h3>
            </div>
            <button className="modal-close" onClick={() => setDeletingId(null)}><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setDeletingId(null)}>Cancel</button>
            <button id="confirm-delete-student-btn" className="btn btn-danger" onClick={() => handleDelete(deletingId)} disabled={deleteLoading}>
              {deleteLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Deleting…</> : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Status Confirm Modal */}
      <div className={`modal-overlay ${confirmBulkStatus !== null ? "open" : ""}`}>
        <div className="modal" style={{ width: 440 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div
                className={`card-icon ${confirmBulkStatus ? "icon-green" : "icon-amber"}`}
                style={{ width: 32, height: 32, fontSize: 14 }}
              >
                <i className={`fa-solid ${confirmBulkStatus ? "fa-user-check" : "fa-user-clock"}`} />
              </div>
              <h3>{confirmBulkStatus ? "Mark Students Active" : "Mark Students Inactive"}</h3>
            </div>
            <button className="modal-close" onClick={() => setConfirmBulkStatus(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {confirmBulkStatus
                ? `Mark ${selected.size} student${selected.size !== 1 ? "s" : ""} as Active? They will appear in course enrollment lists and attendance.`
                : `Mark ${selected.size} student${selected.size !== 1 ? "s" : ""} as Inactive? They will be hidden from course enrollment and attendance, but remain in the database.`}
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setConfirmBulkStatus(null)} disabled={bulkLoading}>
              Cancel
            </button>
            <button
              className={`btn ${confirmBulkStatus ? "btn-primary" : "btn-outline"}`}
              style={!confirmBulkStatus ? { borderColor: "#d97706", color: "#d97706" } : {}}
              onClick={() => handleBulkStatus(confirmBulkStatus)}
              disabled={bulkLoading}
            >
              {bulkLoading
                ? <><i className="fa-solid fa-spinner fa-spin" /> Processing…</>
                : confirmBulkStatus ? "Confirm Active" : "Confirm Inactive"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div className={`toast ${toast.show ? "show" : ""} ${toast.type}`}>
          <i className={`fa-solid ${
            toast.type === "success" ? "fa-circle-check" :
            toast.type === "error"   ? "fa-circle-xmark" : "fa-circle-info"
          }`} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
