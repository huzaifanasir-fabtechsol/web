import { useAuth } from "../context/AuthContext";

export default function Topbar({ title = "Overview" }) {
  const { user } = useAuth();
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Admin";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1a1f2e&color=fff&size=68`;

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div className="topbar-sub">Welcome back, {displayName}</div>
      </div>
      {/* <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search anything..."/>
      </div> */}
      {/* <div className="topbar-icons">
        <div className="icon-btn">
          <i className="fa-regular fa-bell"></i>
          <span className="dot"></span>
        </div>
        <div className="icon-btn">
          <i className="fa-regular fa-envelope"></i>
          <span className="dot" style={{ background: 'var(--accent2)' }}></span>
        </div>
      </div> */}
      {/* <div className="avatar-wrap">
        <img className="avatar"
          src={avatarUrl}
          alt={displayName} />
        <div className="avatar-info">
          <div className="name">{displayName}</div>
          <div className="role">Administrator</div>
        </div>
        <i className="fa-solid fa-chevron-down"></i>
      </div> */}
    </header>
  );
}
