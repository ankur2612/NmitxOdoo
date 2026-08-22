import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/authStore";
import AppShell from "./components/layout/AppShell";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Soon from "./pages/Soon";
import EmployeesPage from "./pages/employees/EmployeesPage";
import EmployeeDetailPage from "./pages/employees/EmployeeDetailPage";
import ProfilePage from "./pages/profile/ProfilePage";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center text-ink-faint" aria-busy="true">
      Loading…
    </div>
  );
}

function RequireAuth({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <Splash />;
  }

  return token ? children : <Navigate to="/login" replace />;
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
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/attendance" element={<Soon title="Attendance" />} />
            <Route path="/timeoff" element={<Soon title="Time Off" />} />
          </Route>

          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
