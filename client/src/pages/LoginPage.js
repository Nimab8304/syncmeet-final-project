import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async ({ email, password, onResult }) => {
    try {
      await login({ email, password });
      onResult?.({ ok: true });
      navigate('/dashboard');
    } catch (error) {
      onResult?.({ ok: false, message: error?.message || 'Login failed' });
    }
  };

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <div className="grid grid-2" style={{ alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', justifyContent: 'center' }}>
          <div>
            <h1 style={{ marginBottom: 8 }}>Welcome back</h1>
            <p style={{ color: 'var(--muted-text)', marginBottom: 16 }}>
              Sign in to view your calendar, invitations, and upcoming meetings.
            </p>
            <LoginForm onLogin={handleLogin} />
            <p style={{ marginTop: 12, fontSize: 14 }}>
              New here? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
        <div className="card" style={{ background: '#fff' }}>
          <h2 className="section-title">Why SyncMeet?</h2>
          <ul style={{ lineHeight: 1.8, color: '#374151' }}>
            <li>• Fast meeting creation with invitations.</li>
            <li>• Color‑coded calendar (owner vs participant).</li>
            <li>• Reminders before meetings.</li>
            <li>• Archive past meetings in one click.</li>
            <li>• Optional Google Calendar sync.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
