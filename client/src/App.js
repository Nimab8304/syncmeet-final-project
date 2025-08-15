// src/App.js
import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  useEffect,
} from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ArchivePage from "./pages/ArchivePage";
import Navbar from "./components/layout/Navbar";
import Toast from "./components/ui/Toast";

// Lazy Settings page (expects ./pages/SettingsPage to export default)
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));

// Protected Route
function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { user } = useAuth();
  return user?.token ? children : <Navigate to={redirectTo} replace />;
}

// Simple layout wrapper for protected pages
function ProtectedLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main style={{ padding: "16px", maxWidth: 1200, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}

// Toast context to trigger global toasts anywhere (lightweight)
const ToastContext = createContext({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user?.token ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user?.token ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <ArchivePage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <React.Suspense fallback={<div style={{ padding: 16 }}>Loading settings…</div>}>
                <SettingsPage />
              </React.Suspense>
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirects */}
      <Route
        path="/"
        element={user?.token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // Global toast state (simple, no extra deps)
  const [toast, setToast] = useState({ open: false, type: "info", message: "" });
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "info", duration = 2500) => {
    setToast({ open: true, message, type });
    if (timerRef.current) clearTimeout(timerRef.current);
    if (duration) {
      timerRef.current = setTimeout(() => {
        setToast((t) => ({ ...t, open: false }));
        timerRef.current = null;
      }, duration);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AuthProvider>
      <ToastContext.Provider value={{ showToast }}>
        <Router>
          <AppRoutes />
          <Toast
            open={toast.open}
            type={toast.type}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
          >
            {toast.message}
          </Toast>
        </Router>
      </ToastContext.Provider>
    </AuthProvider>
  );
}
