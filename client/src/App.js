import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// Import other pages like DashboardPage when ready
// import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Example protected route (replace with actual DashboardPage when implemented) */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}

          {/* Redirect to login by default */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
