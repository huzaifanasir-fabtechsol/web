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
      {/* Brand Header */}
      <div className="sidebar-brand-container">
        <div className="sidebar-logo-wrap">
          <img src="/logo.png" alt="EquiManage Logo" className="sidebar-logo-img" />
        </div>
        <div className="sidebar-title-wrap">
          <div className="sidebar-brand-name">Abu Ali Horse</div>
          <div className="sidebar-brand-sub">Riding School System</div>
        </div>
      </div>

      {/* Gold Divider matching login page */}
      <div className="sidebar-gold-divider"></div>

      <div className="nav-label">Navigation</div>

      <nav className="sidebar-nav-list">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-chart-pie"></i></span>
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-user-graduate"></i></span>
          <span className="nav-text">Students</span>
        </NavLink>

        <NavLink to="/horses" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-horse-head"></i></span>
          <span className="nav-text">Horses</span>
        </NavLink>

        <NavLink to="/horse-owners" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-id-card"></i></span>
          <span className="nav-text">Horse Owners</span>
        </NavLink>

        <NavLink to="/courses" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-book-open"></i></span>
          <span className="nav-text">Courses</span>
        </NavLink>

        <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-clipboard-check"></i></span>
          <span className="nav-text">Attendance</span>
        </NavLink>

        <NavLink to="/fees/records" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-money-bill-wave"></i></span>
          <span className="nav-text">Transactions</span>
        </NavLink>

        <NavLink to="/workers/list" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-hard-hat"></i></span>
          <span className="nav-text">Workers</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-chart-bar"></i></span>
          <span className="nav-text">Reports</span>
        </NavLink>
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <div className="sidebar-gold-divider sub-divider"></div>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon-wrap"><i className="fa-solid fa-gear"></i></span>
          <span className="nav-text">Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="nav-item logout-btn" title="Sign out of system">
          <span className="nav-icon-wrap"><i className="fa-solid fa-arrow-right-from-bracket"></i></span>
          <span className="nav-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
