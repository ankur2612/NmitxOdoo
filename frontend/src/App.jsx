import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/authStore";
import AppShell from "./components/layout/AppShell";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ChangePassword from "./pages/ChangePassword";
import EmployeesPage from "./pages/employees/EmployeesPage";
import EmployeeDetailPage from "./pages/employees/EmployeeDetailPage";
import ProfilePage from "./pages/profile/ProfilePage";
import AttendancePage from "./pages/attendance/AttendancePage";
import TimeOffPage from "./pages/timeoff/TimeOffPage";
import SettingsPage from "./pages/settings/SettingsPage";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center text-ink-faint" aria-busy="true">
      Loading…
    </div>
  );
}

function RequireAuth({ children }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Splash />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // A system-generated password must be replaced before anything else opens.
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}

function RedirectIfSignedIn({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <Splash />;
  }

  return token ? <Navigate to="/employees" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfSignedIn>
                <SignIn />
              </RedirectIfSignedIn>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfSignedIn>
                <SignUp />
              </RedirectIfSignedIn>
            }
          />
          <Route
            path="/change-password"
            element={
              <RequireAuth>
                <ChangePassword />
              </RequireAuth>
            }
          />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/timeoff" element={<TimeOffPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
