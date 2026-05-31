import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><i className="fa-solid fa-horse"></i></div>
        <div>
          <div className="logo-text">EquiManage</div>
          <div className="logo-sub">Riding School System</div>
        </div>
      </div>

      <div className="nav-label">Main Menu</div>

      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-chart-pie"></i> Dashboard
      </NavLink>
      <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-user-graduate"></i> Students <span className="badge">142</span>
      </NavLink>
      {/* <NavLink to="/riders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-person-biking"></i> Riders
      </NavLink> */}
      <NavLink to="/horses" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-horse-head"></i> Horses
      </NavLink>
      <NavLink to="/horse-owners" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-id-card"></i> Horse Owners
      </NavLink>
      <NavLink to="/courses" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-book-open"></i> Courses
      </NavLink>
      <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-clipboard-check"></i> Attendance
      </NavLink>
      <NavLink to="/fees/records" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-money-bill-wave"></i> Transactions
      </NavLink>
      <NavLink to="/workers/list" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-hard-hat"></i> Workers
      </NavLink>
      <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <i className="fa-solid fa-chart-bar"></i> Reports
      </NavLink>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <i className="fa-solid fa-gear"></i> Settings
        </NavLink>
        <button onClick={handleLogout} className="nav-item logout" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
        </button>
      </div>
    </aside>
  );
}
