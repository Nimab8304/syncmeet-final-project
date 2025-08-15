import React, { useState } from 'react';
import Spinner from '../ui/Spinner';

export default function RegisterForm({ onRegister }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      await onRegister({
        name,
        email,
        password,
        onResult: ({ ok, message }) => {
          if (!ok) setError(message || 'Registration failed');
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Registration form">
      <h2 className="section-title">Register</h2>
      {error && <p style={{ color: '#dc2626', marginBottom: 8 }}>{error}</p>}

      <div>
        <label htmlFor="reg-name">Name</label>
        <input
          id="reg-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={submitting}
        />
      </div>

      <button type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? <Spinner size={18} color="#fff" label="" /> : 'Register'}
      </button>
    </form>
  );
}
