import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage } from '../services/api';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/lobby');
    } catch (err) {
      setError(extractErrorMessage(err, '用户名或密码错误'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="cosmic-bg" />
      <button className="auth-back" onClick={() => navigate('/')}>← 返回首页</button>

      <div className="auth-container glass-card">
        <div className="auth-header">
          <h2 className="auth-title">LOGIN</h2>
          <p className="auth-subtitle">输入凭证 · 进入战场</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>USERNAME</label>
            <input
              className="neon-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>PASSWORD</label>
            <input
              className="neon-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="neon-btn large" disabled={submitting}>
            {submitting ? 'LOGGING IN...' : '▶ ENTER'}
          </button>
        </form>

        <p className="auth-footer">
          还没有账号？
          <a href="#register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
            立即注册 →
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
