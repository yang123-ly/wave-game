import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage } from '../services/api';
import './LoginPage.css';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('用户名至少需要 3 个字符');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      await register(username, password);
      navigate('/lobby');
    } catch (err) {
      // 优雅展示后端返回的具体错误消息（如「用户名已存在」）
      setError(extractErrorMessage(err, '注册失败，请稍后重试'));
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
          <h2 className="auth-title">SIGN UP</h2>
          <p className="auth-subtitle">创建账号 · 加入对决</p>
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
              placeholder="至少 3 个字符"
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
              placeholder="至少 6 个字符"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label>CONFIRM PASSWORD</label>
            <input
              className="neon-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="neon-btn large purple" disabled={submitting}>
            {submitting ? 'CREATING...' : '▶ CREATE'}
          </button>
        </form>

        <p className="auth-footer">
          已有账号？
          <a href="#login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            立即登录 →
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
