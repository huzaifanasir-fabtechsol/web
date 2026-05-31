import { useState } from "react";

export default function Riders() {
  const [showModal, setShowModal] = useState(false);
  const [riders] = useState([
    { id: 1, name: "Alice Cooper", riderId: "RID-001", level: "Intermediate", age: 24, phone: "+1 234 567 8900", status: "Active" },
    { id: 2, name: "Bob Martin", riderId: "RID-002", level: "Advanced", age: 31, phone: "+1 234 567 8901", status: "Active" },
    { id: 3, name: "Charlie Brown", riderId: "RID-003", level: "Beginner", age: 16, phone: "+1 234 567 8902", status: "Inactive" },
  ]);

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Rider Profiles</h2>
          <p>Manage experienced riders and independent members.</p>
        </div>
        <div>
          <button className="btn btn-outline" style={{ marginRight: 10 }}>
            <i className="fa-solid fa-file-export"></i> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-plus"></i> Add New Rider
          </button>
        </div>
      </div>

      <div className="mini-stats">
        <div className="mini-card">
          <div className="mini-icon icon-blue">
            <i className="fa-solid fa-person-biking"></i>
          </div>
          <div>
            <div className="mini-val">84</div>
            <div className="mini-lbl">Total Riders</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-green">
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div>
            <div className="mini-val">76</div>
            <div className="mini-lbl">Active Riders</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-orange">
            <i className="fa-solid fa-ranking-star"></i>
          </div>
          <div>
            <div className="mini-val">12</div>
            <div className="mini-lbl">Advanced Level</div>
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-icon icon-purple">
            <i className="fa-solid fa-horse-head"></i>
          </div>
          <div>
            <div className="mini-val">28</div>
            <div className="mini-lbl">Own Horses</div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search riders by name or ID..." />
          </div>
          
          <select className="filter-select">
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <div className="tbl-count">Showing 1-10 of 84 riders</div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" /></th>
                <th className="sortable">Rider <i className="fa-solid fa-sort"></i></th>
                <th className="sortable">Level <i className="fa-solid fa-sort"></i></th>
                <th>Age</th>
                <th>Contact Info</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr key={rider.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="rider-cell">
                      <div className="tbl-avatar">
                        <img src={`https://ui-avatars.com/api/?name=${rider.name.replace(' ', '+')}&background=random`} alt={rider.name} />
                      </div>
                      <div>
                        <div className="r-name">{rider.name}</div>
                        <div className="r-id">{rider.riderId}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontWeight: 500 }}>{rider.level}</span></td>
                  <td>{rider.age} yrs</td>
                  <td>{rider.phone}</td>
                  <td>
                    <span className={`pill ${rider.status === 'Active' ? 'pill-green' : 'pill-gray'}`}>
                      {rider.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-group" style={{ justifyContent: 'center' }}>
                      <button className="act-btn act-view"><i className="fa-regular fa-eye"></i></button>
                      <button className="act-btn act-edit"><i className="fa-regular fa-pen-to-square"></i></button>
                      <button className="act-btn act-delete"><i className="fa-regular fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="page-info">Showing 1 to 3 of 84 entries</div>
          <div className="pagination">
            <button className="page-btn"><i className="fa-solid fa-chevron-left"></i></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">...</button>
            <button className="page-btn"><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </div>

      {/* Add Rider Modal */}
      <div className={`modal-overlay ${showModal ? 'open' : ''}`}>
        <div className="modal" style={{ width: 680 }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="card-icon icon-blue" style={{ width: 32, height: 32, fontSize: 14 }}>
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <h3>Register New Rider</h3>
            </div>
            <button className="modal-close" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-divider"><span>Personal Information</span></div>
              
              <div className="form-group">
                <label className="form-label">First Name <span>*</span></label>
                <input type="text" className="form-control" placeholder="First Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span>*</span></label>
                <input type="text" className="form-control" placeholder="Last Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth <span>*</span></label>
                <input type="date" className="form-control" />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-control" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" placeholder="rider@example.com" />
              </div>

              <div className="form-divider" style={{ marginTop: 12 }}><span>Rider Details</span></div>
              
              <div className="form-group">
                <label className="form-label">Experience Level <span>*</span></label>
                <select className="form-control">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" className="form-control" placeholder="70" />
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" className="form-control" placeholder="175" />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowModal(false)}>Save Rider</button>
          </div>
        </div>
      </div>
    </div>
  );
}
