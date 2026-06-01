import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// const Router = window.navigator.userAgent.includes('Electron') ? HashRouter : BrowserRouter;
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Riders from "./pages/Riders";
import Horses from "./pages/Horses";
import HorseOwners from "./pages/HorseOwners";
import Courses from "./pages/Courses";
import Attendance from "./pages/Attendance";
import Settings from "./pages/Settings";
import AddTransaction from "./pages/Fee/AddFee";
import Transactions from "./pages/Fee/FeeRecords";
import Receipt from "./pages/Fee/Receipt";
import AddWorker from "./pages/Worker/AddWorker";
import WorkerList from "./pages/Worker/WorkerList";
import Reports from "./pages/Reports";
import StudentDetails from "./pages/StudentDetails";
import CourseDetails from "./pages/CourseDetails";
import CourseEnrollment from "./pages/CourseEnrollment";
import HorseDetails from "./pages/HorseDetails";
import OwnerDetails from "./pages/OwnerDetails";
import WorkerDetails from "./pages/Worker/WorkerDetails";
import "./index.css";

/** Redirects unauthenticated users to /login */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Backend sends: /reset-password/:uid/:token/ */}
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
      {/* Fallback for bare /reset-password (shows invalid-link message) */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/riders" element={<Riders />} />
        <Route path="/horses" element={<Horses />} />
        <Route path="/horse-owners" element={<HorseOwners />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/fees/records" element={<Transactions />} />
        <Route path="/fees/receipt" element={<Receipt />} />
        <Route path="/fees/receipt/:id" element={<Receipt />} />
        <Route path="/billing/add" element={<AddTransaction />} />
        <Route path="/billing/edit/:id" element={<AddTransaction />} />
        <Route path="/workers/add" element={<AddWorker />} />
        <Route path="/workers/edit/:id" element={<AddWorker />} />
        <Route path="/workers/list" element={<WorkerList />} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/courses/:id/enrollment" element={<CourseEnrollment />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/horses/:id" element={<HorseDetails />} />
        <Route path="/horse-owners/:id" element={<OwnerDetails />} />
        <Route path="/workers/:id" element={<WorkerDetails />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
