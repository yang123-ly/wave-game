import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <div className="cosmic-bg" />
      <div className="scan-overlay" />

      {/* 装饰几何 */}
      <div className="home-geo">
        <div className="geo-shape geo-triangle" style={{ top: '10%', left: '8%' }} />
        <div className="geo-shape geo-square" style={{ top: '20%', right: '12%' }} />
        <div className="geo-shape geo-circle" style={{ bottom: '15%', left: '15%' }} />
        <div className="geo-shape geo-triangle" style={{ bottom: '20%', right: '8%' }} />
      </div>

      <div className="home-content">
        <div className="home-tag">
          <span className="tag-dot" />
          ARCADE BATTLE · 2026
        </div>

        <h1 className="home-title">
          <span className="title-line">SKY</span>
          <span className="title-line dash">DUEL</span>
        </h1>
        <p className="home-subtitle">双人对决 · 云上之巅</p>

        <p className="home-desc">
          <span className="text-neon-cyan">3D 跑酷</span> ·{' '}
          <span className="text-neon-purple">浮空赛道</span> ·{' '}
          <span className="text-neon-magenta">推撞抢道具</span>
        </p>

        <div className="home-actions">
          <button
            className="neon-btn large"
            onClick={() => navigate(isAuthenticated ? '/lobby' : '/login')}
          >
            ▶ 开始游戏
          </button>
          <button className="neon-btn" onClick={() => navigate('/config')}>
            🗺️ 棋盘配置
          </button>
          {!isAuthenticated && (
            <button className="neon-btn purple" onClick={() => navigate('/register')}>
              注册账号
            </button>
          )}
        </div>

        <div className="home-features">
          <FeatureCard
            icon="☁️"
            title="浮空赛道"
            desc="跳板、齿轮、消失砖、终点旗"
            color="cyan"
          />
          <FeatureCard
            icon="⚔️"
            title="对抗闯关"
            desc="推开对方 / 抢道具 / 一台键盘"
            color="purple"
          />
          <FeatureCard
            icon="🏆"
            title="先到为王"
            desc="谁先抵达云端旗杆，谁就是赢家"
            color="magenta"
          />
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: 'cyan' | 'purple' | 'magenta';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color }) => (
  <div className={`feature-card feature-${color}`}>
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

export default HomePage;
