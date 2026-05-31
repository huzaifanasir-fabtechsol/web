import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listWorkers, deleteWorker } from "../../api/workerApi";

const GENDERS = ["Male", "Female", "Other"];
const PAGE_SIZE = 10;

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function WorkerList() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // List state
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal / Detail state
  const [viewingWorker, setViewingWorker] = useState(null);
  
  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listWorkers(accessToken, {
        search: debouncedSearch,
        gender: filterGender,
        page,
        page_size: PAGE_SIZE,
      });
      setWorkers(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, debouncedSearch, filterGender, page]);

  useEffect(() => {
    if (accessToken) {
      fetchWorkers();
    }
  }, [fetchWorkers, accessToken]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterGender]);

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await deleteWorker(accessToken, id);
      setDeletingId(null);
      fetchWorkers();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Worker Directory</h2>
          <p>Manage all staff, trainers, and employees.</p>
        </div>
        <div>
          <Link to="/workers/add" className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Add Worker
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
      )}

      <div className="table-card" style={{ width: "100%" }}>
        <div className="table-toolbar">
          <div className="table-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by name, email or CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
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
            {loading ? "Loading…" : `Showing ${startEntry}–${endEntry} of ${totalCount} workers`}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="sortable">Worker Name <i className="fa-solid fa-sort"></i></th>
                <th>CNIC</th>
                <th>Gender</th>
                <th className="sortable">Role <i className="fa-solid fa-sort"></i></th>
                <th>Monthly Salary</th>
                <th>Hire Date</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading workers…
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No workers found.
                  </td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker.id}>
                    <td>
                      <div className="rider-cell">
                        <div className="tbl-avatar" style={{ background: 'var(--text-soft)' }}>
                          {worker.profile_photo ? (
                            <img src={worker.profile_photo} alt={worker.name} />
                          ) : (
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}&background=random`} alt={worker.name} />
                          )}
                        </div>
                        <div>
                          <div className="r-name">{worker.name}</div>
                          <div className="r-id">{worker.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 13, fontWeight: 500 }}>{worker.cnic}</span></td>
                    <td>{worker.gender}</td>
                    <td><span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{worker.job_role}</span></td>
                    <td>Rs. {Number(worker.salary).toLocaleString()}</td>
                    <td>{worker.hire_date}</td>
                    <td>
                      <div className="action-group" style={{ justifyContent: 'center' }}>
                        <button
                          className="act-btn act-view"
                          title="View Profile"
                          onClick={() => navigate(`/workers/${worker.id}`)}
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>
                        <button
                          className="act-btn act-edit"
                          title="Edit Profile"
                          onClick={() => navigate(`/workers/edit/${worker.id}`)}
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button
                          className="act-btn act-delete"
                          title="Remove"
                          onClick={() => setDeletingId(worker.id)}
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

      {/* Profile Detail View Modal */}
      <div className={`modal-overlay ${viewingWorker ? "open" : ""}`}>
        <div className="modal" style={{ width: 500 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-blue" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-eye"></i>
              </div>
              <h3>Employee Profile</h3>
            </div>
            <button className="modal-close" onClick={() => setViewingWorker(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body" style={{ padding: "24px" }}>
            {viewingWorker && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                  <div className="tbl-avatar" style={{ width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {viewingWorker.profile_photo ? (
                      <img src={viewingWorker.profile_photo} alt={viewingWorker.name} />
                    ) : (
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewingWorker.name)}&background=random`} alt={viewingWorker.name} />
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", color: "var(--text-dark)" }}>{viewingWorker.name}</h4>
                    <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>{viewingWorker.job_role}</span>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>CNIC</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingWorker.cnic}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Gender</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingWorker.gender}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Email</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)", wordBreak: "break-all" }}>{viewingWorker.email}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Date of Birth</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingWorker.date_of_birth}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Salary</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>Rs. {Number(viewingWorker.salary).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--text-soft)", textTransform: "uppercase" }}>Hire Date</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{viewingWorker.hire_date}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setViewingWorker(null)}>Close</button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal-overlay ${deletingId ? "open" : ""}`}>
        <div className="modal" style={{ width: 420 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-red" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3>Remove Worker</h3>
            </div>
            <button className="modal-close" onClick={() => setDeletingId(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Are you sure you want to remove this employee? This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setDeletingId(null)}>Cancel</button>
            <button
              className="btn className btn-danger"
              onClick={() => handleDelete(deletingId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Removing…</> : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
