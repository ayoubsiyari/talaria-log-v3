import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = ({ onLoginSuccess }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </div>
  );
};

export default LoginPage;
