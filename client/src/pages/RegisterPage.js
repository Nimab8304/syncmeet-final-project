import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async ({ name, email, password }) => {
    try {
      await register({ name, email, password });
      alert('Registration successful! Please login.');
      // Redirect to login page after successful registration
      navigate('/login');
    } catch (error) {
      alert(error.message);
    }
  };

  return <RegisterForm onRegister={handleRegister} />;
}
