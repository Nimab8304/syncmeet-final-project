import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';

export default function RegisterPage() {
  const handleRegister = async ({ name, email, password }) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) throw new Error('Registration failed');
      const data = await response.json();
      alert('Registration successful! Please login.');
      // Optionally redirect to login page
    } catch (error) {
      alert(error.message);
    }
  };

  return <RegisterForm onRegister={handleRegister} />;
}
