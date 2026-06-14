import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Admin";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1a1f2e&color=fff&size=68`;

  const getPageTitle = (pathname) => {
    if (pathname === "/" || pathname === "") return "Dashboard";
    if (pathname === "/students") return "Students";
    if (pathname === "/horses") return "Horses";
    if (pathname === "/horse-owners") return "Horse Owners";
    if (pathname === "/courses") return "Courses";
    if (pathname === "/attendance") return "Attendance";
    if (pathname === "/fees/records") return "Transactions";
    if (pathname === "/reports") return "Reports";
    if (pathname === "/settings") return "Settings";

    // Detail & Action pages
    if (pathname.startsWith("/students/")) return "Student Details";
    if (pathname.startsWith("/courses/") && pathname.endsWith("/enrollment")) return "Course Enrollment";
    if (pathname.startsWith("/courses/")) return "Course Details";
    if (pathname.startsWith("/horses/")) return "Horse Details";
    if (pathname.startsWith("/horse-owners/")) return "Owner Details";
    if (pathname === "/workers/add") return "Add Worker";
    if (pathname.startsWith("/workers/edit/")) return "Edit Worker";
    if (pathname === "/workers/list") return "Workers";
    if (pathname.startsWith("/workers/")) return "Worker Details";
    if (pathname === "/billing/add") return "Add Transaction";
    if (pathname.startsWith("/billing/edit/")) return "Edit Transaction";
    if (pathname.startsWith("/fees/receipt")) return "Receipt";

    return "Overview";
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="topbar-logo-mobile">
          <img src="/logo.png" alt="EquiManage Logo" style={{ height: "32px", objectFit: "contain" }} />
        </div>
        <div>
          <div className="topbar-title">{title}</div>
          <div className="topbar-sub">Welcome back, {displayName}</div>
        </div>
      </div>
      <div className="avatar-wrap">
        <img className="avatar" src={avatarUrl} alt={displayName} />
        <div className="avatar-info">
          <div className="name">{displayName}</div>
          <div className="role">Administrator</div>
        </div>
      </div>
    </header>
  );
}
