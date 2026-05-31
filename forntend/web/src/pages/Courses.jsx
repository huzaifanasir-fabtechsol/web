import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../api/courseStudentApi";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EMPTY_FORM = {
  name: "",
  duration_months: "",
  fee: "",
  class_time: "",
  class_days: [],
};

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Courses() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // List state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterDays, setFilterDays] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCourses(accessToken, {
        search: debouncedSearch,
        class_days: filterDays,
        page,
        page_size: PAGE_SIZE,
      });
      setCourses(data.results);
      setTotalPages(data.total_pages);
      setTotalCount(data.count);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, debouncedSearch, filterDays, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterDays]);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function openEdit(course) {
    setEditingCourse(course);
    setForm({
      name: course.name,
      duration_months: course.duration_months,
      fee: course.fee,
      class_time: course.class_time,
      class_days: course.class_days || [],
    });
    setFormErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((fe) => ({ ...fe, [name]: "" }));
  }

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      class_days: f.class_days.includes(day)
        ? f.class_days.filter((d) => d !== day)
        : [...f.class_days, day],
    }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Course name is required.";
    if (!form.duration_months || isNaN(form.duration_months) || Number(form.duration_months) < 1)
      errs.duration_months = "Enter a valid duration (≥ 1 month).";
    if (!form.fee || isNaN(form.fee) || Number(form.fee) < 0)
      errs.fee = "Enter a valid fee.";
    if (!form.class_time) errs.class_time = "Class time is required.";
    if (form.class_days.length === 0) errs.class_days = "Select at least one class day.";
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
        duration_months: Number(form.duration_months),
        fee: Number(form.fee),
      };
      if (editingCourse) {
        await updateCourse(accessToken, editingCourse.id, payload);
      } else {
        await createCourse(accessToken, payload);
      }
      closeModal();
      fetchCourses();
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
      await deleteCourse(accessToken, id);
      setDeletingId(null);
      fetchCourses();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Training Courses</h2>
          <p>Manage riding programs, schedules, and class details.</p>
        </div>
        <div>
          <button className="btn btn-primary" id="create-course-btn" onClick={openCreate}>
            <i className="fa-solid fa-plus"></i> Create Course
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
              id="course-search"
              type="text"
              placeholder="Search by name, duration or fee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            id="course-filter-days"
            className="filter-select"
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
          >
            <option value="">All Days</option>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
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
                <th className="sortable">Course Name <i className="fa-solid fa-sort"></i></th>
                <th>Duration</th>
                <th>Fee</th>
                <th>Class Time</th>
                <th>Class Days</th>
                <th style={{ textAlign: "center" }}>Enrolled</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading courses…
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No courses found.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="r-name">{course.name}</div>
                    </td>
                    <td>{course.duration_months} month{course.duration_months !== 1 ? "s" : ""}</td>
                    <td>Rs. {Number(course.fee).toLocaleString()}</td>
                    <td>{course.class_time}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(course.class_days || []).map((day) => (
                          <span key={day} className="pill pill-blue" style={{ fontSize: 11 }}>{day.slice(0, 3)}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="pill pill-purple"
                        style={{ fontSize: 12, cursor: "pointer" }}
                        title="Manage Enrollment"
                        onClick={() => navigate(`/courses/${course.id}/enrollment`)}
                      >
                        <i className="fa-solid fa-users" style={{ marginRight: 4 }} />
                        {course.enrolled_count ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="action-group" style={{ justifyContent: "center" }}>
                        <button
                          id={`view-course-${course.id}`}
                          className="act-btn act-view"
                          title="View Course Details"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>
                        <button
                          id={`manage-enrollment-${course.id}`}
                          className="act-btn"
                          title="Manage Student Enrollment"
                          style={{ color: "#8b5cf6" }}
                          onClick={() => navigate(`/courses/${course.id}/enrollment`)}
                        >
                          <i className="fa-solid fa-user-group"></i>
                        </button>
                        <button
                          id={`edit-course-${course.id}`}
                          className="act-btn act-edit"
                          title="Edit Course"
                          onClick={() => openEdit(course)}
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button
                          id={`delete-course-${course.id}`}
                          className="act-btn act-delete"
                          title="Delete Course"
                          onClick={() => setDeletingId(course.id)}
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

      {/* Create / Edit Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`}>
        <div className="modal" style={{ width: 680 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-purple" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-book-open"></i>
              </div>
              <h3>{editingCourse ? "Edit Course" : "Create New Course"}</h3>
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
              <div className="form-divider"><span>Course Details</span></div>

              <div className="form-group span-2">
                <label className="form-label">Course Name <span>*</span></label>
                <input
                  id="course-name-input"
                  type="text"
                  name="name"
                  className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                  placeholder="e.g. Beginner Riding"
                  value={form.name}
                  onChange={handleFormChange}
                />
                {formErrors.name && <div className="field-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Months) <span>*</span></label>
                <input
                  id="course-duration-input"
                  type="number"
                  name="duration_months"
                  min="1"
                  className={`form-control ${formErrors.duration_months ? "is-invalid" : ""}`}
                  placeholder="3"
                  value={form.duration_months}
                  onChange={handleFormChange}
                />
                {formErrors.duration_months && <div className="field-error">{formErrors.duration_months}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Fee (Rs.) <span>*</span></label>
                <input
                  id="course-fee-input"
                  type="number"
                  name="fee"
                  min="0"
                  className={`form-control ${formErrors.fee ? "is-invalid" : ""}`}
                  placeholder="5000"
                  value={form.fee}
                  onChange={handleFormChange}
                />
                {formErrors.fee && <div className="field-error">{formErrors.fee}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Class Time <span>*</span></label>
                <input
                  id="course-time-input"
                  type="time"
                  name="class_time"
                  className={`form-control ${formErrors.class_time ? "is-invalid" : ""}`}
                  value={form.class_time}
                  onChange={handleFormChange}
                />
                {formErrors.class_time && <div className="field-error">{formErrors.class_time}</div>}
              </div>

              <div className="form-group col-full">
                <label className="form-label">Class Days <span>*</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`day-chip ${form.class_days.includes(day) ? "day-chip-active" : ""}`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {formErrors.class_days && <div className="field-error">{formErrors.class_days}</div>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Cancel</button>
            <button
              id="save-course-btn"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</> : (editingCourse ? "Update Course" : "Save Course")}
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
              <h3>Delete Course</h3>
            </div>
            <button className="modal-close" onClick={() => setDeletingId(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Are you sure you want to delete this course? This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setDeletingId(null)}>Cancel</button>
            <button
              id="confirm-delete-course-btn"
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
