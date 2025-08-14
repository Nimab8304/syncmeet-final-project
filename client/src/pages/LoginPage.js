import React from 'react';
import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  const handleLogin = async ({ email, password }) => {
    // Call backend login API (e.g., via axios)
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      // Save token and user info, e.g., to context or localStorage
      console.log('Login successful', data);
      // Redirect or update app state as needed
    } catch (error) {
      alert(error.message);
    }
  };

  return <LoginForm onLogin={handleLogin} />;
}
