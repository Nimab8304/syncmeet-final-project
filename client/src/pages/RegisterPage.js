import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async ({ name, email, password, onResult }) => {
    try {
      await register({ name, email, password });
      onResult?.({ ok: true, message: 'Registration successful! Please login.' });
      navigate('/login');
    } catch (error) {
      onResult?.({ ok: false, message: error?.message || 'Registration failed' });
    }
  };

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <div className="grid grid-2" style={{ alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', justifyContent: 'center' }}>
          <div>
            <h1 style={{ marginBottom: 8 }}>Create your account</h1>
            <p style={{ color: 'var(--muted-text)', marginBottom: 16 }}>
              It takes less than a minute to get started.
            </p>
            <RegisterForm onRegister={handleRegister} />
            <p style={{ marginTop: 12, fontSize: 14 }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
        <div className="card" style={{ background: '#fff' }}>
          <h2 className="section-title">What you’ll get</h2>
          <ul style={{ lineHeight: 1.8, color: '#374151' }}>
            <li>• Monthly/weekly calendar with status colors.</li>
            <li>• Invitations with one‑click Accept/Decline.</li>
            <li>• Reminders and easy archiving.</li>
            <li>• Optional Google Calendar integration.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
