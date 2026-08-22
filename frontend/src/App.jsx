import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/authStore";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

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

  return token ? <Navigate to="/" replace /> : children;
}

function Placeholder() {
  const { user, signOut } = useAuth();

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="font-display text-3xl text-ink">
          Signed in as {user?.firstName}
        </p>
        <p className="mt-2 font-mono text-ink-dim tnum">{user?.loginId}</p>
        <p className="mt-6 text-ink-faint">
          The employee dashboard lands here next.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-8 rounded-field border border-line px-4 py-2 text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Log Out
        </button>
      </div>
    </main>
  );
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
            path="/"
            element={
              <RequireAuth>
                <Placeholder />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
