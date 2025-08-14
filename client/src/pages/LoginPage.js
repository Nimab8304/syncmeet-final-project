import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    try {
      await login({ email, password });
      // Redirect to dashboard or home after successful login
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  return <LoginForm onLogin={handleLogin} />;
}
