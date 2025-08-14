import React, { useState } from 'react';
import Spinner from '../ui/Spinner';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    try {
      setSubmitting(true);
      await onLogin({
        email,
        password,
        onResult: ({ ok, message }) => {
          if (!ok) setError(message || 'Login failed');
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      <h2 className="section-title">Login</h2>
      {error && <p style={{ color: '#dc2626', marginBottom: 8 }}>{error}</p>}

      <div>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={submitting}
        />
      </div>

      <button type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? <Spinner size={18} color="#fff" label="" /> : 'Login'}
      </button>
    </form>
  );
}
