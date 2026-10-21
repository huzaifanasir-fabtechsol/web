import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Administrator";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=002F24&color=C5A880&size=72&bold=true`;

  const getPageInfo = (pathname) => {
    if (pathname === "/" || pathname === "") return { title: "Dashboard Overview", sub: "Equestrian academy operational summary & metrics" };
    if (pathname === "/students") return { title: "Student Directory", sub: "Manage riders, admissions & training tiers" };
    if (pathname === "/horses") return { title: "Stables & Horses", sub: "Equine profiles, lineage, medical records & status" };
    if (pathname === "/horse-owners") return { title: "Horse Owners", sub: "Private horse ownerships & stabling records" };
    if (pathname === "/courses") return { title: "Training Courses", sub: "Curriculum schedules, skill tiers & capacity" };
    if (pathname === "/attendance") return { title: "Riding Attendance", sub: "Daily session check-ins, horses & student attendance" };
    if (pathname === "/fees/records") return { title: "Financial Transactions", sub: "Ledgers, invoices, dues & payments" };
    if (pathname === "/reports") return { title: "Analytics & Reports", sub: "Comprehensive performance and attendance insights" };
    if (pathname === "/settings") return { title: "System Settings", sub: "Academy configuration, security & preferences" };

    // Detail & Action pages
    if (pathname.startsWith("/students/")) return { title: "Student Profile", sub: "Detailed rider history and course enrollments" };
    if (pathname.startsWith("/courses/") && pathname.endsWith("/enrollment")) return { title: "Course Enrollment", sub: "Assign students and horses to training slots" };
    if (pathname.startsWith("/courses/")) return { title: "Course Details", sub: "Curriculum structure, enrollments and timetable" };
    if (pathname.startsWith("/horses/")) return { title: "Equine Details", sub: "Medical history, lineage, height and assignees" };
    if (pathname.startsWith("/horse-owners/")) return { title: "Owner Profile", sub: "Owner contact and registered horses" };
    if (pathname === "/workers/add") return { title: "Register Staff", sub: "Onboard instructor, groom or farrier staff" };
    if (pathname.startsWith("/workers/edit/")) return { title: "Edit Staff", sub: "Update staff details and assignment" };
    if (pathname === "/workers/list") return { title: "Academy Staff", sub: "Instructors, stable grooms, veterinarians & team" };
    if (pathname.startsWith("/workers/")) return { title: "Staff Member", sub: "Profile, roles and compensation" };
    if (pathname === "/billing/add") return { title: "New Transaction", sub: "Create student invoice or fee record" };
    if (pathname.startsWith("/billing/edit/")) return { title: "Edit Transaction", sub: "Modify billing item details" };
    if (pathname.startsWith("/fees/receipt")) return { title: "Official Receipt", sub: "Abu Ali Riding School official payment voucher" };

    return { title: "Overview", sub: "Abu Ali Horse Riding School System" };
  };

  const { title, sub } = getPageInfo(location.pathname);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo-mobile">
          <img src="/logo.png" alt="EquiManage Logo" />
        </div>
        <div className="topbar-title-group">
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-sub">{sub}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick status pill */}
        <div className="topbar-academy-badge">
          <span className="academy-dot"></span>
          <span className="academy-badge-text">Academy Active</span>
        </div>

        {/* User Profile Card */}
        <div className="avatar-wrap" title={`Logged in as ${displayName}`}>
          <img className="avatar" src={avatarUrl} alt={displayName} />
          <div className="avatar-info">
            <div className="name">{displayName}</div>
            <div className="role">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
