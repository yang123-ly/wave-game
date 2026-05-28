import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LobbyPage.css';

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleLocalGame = () => navigate('/game/local');
  const handleJumpGame = () => navigate('/jump/local');
  const handleWaveGame = () => navigate('/wave/local');
  const handleProfile = () => navigate('/profile');
  const handleOnlineMatch = () => {
    // 在线匹配暂未实现：进入"等待对手"的本地占位
    navigate('/game/online-match');
  };
  const handleCreateRoom = () => {
    const code = generateRoomCode();
    navigate(`/game/room-${code}`);
  };
  const handleJoinRoom = () => {
    setError('');
    const code = roomCode.trim();
    if (code.length < 4) {
      setError('请输入正确的房间号');
      return;
    }
    navigate(`/game/${code}`);
  };
  const handleLeaderboard = () => navigate('/leaderboard');
  const handlePets = () => navigate('/pets');
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const winRate =
    user?.totalWins && (user.totalWins + (user.totalLosses ?? 0)) > 0
      ? Math.round((user.totalWins / (user.totalWins + (user.totalLosses ?? 0))) * 100)
      : 0;

  return (
    <div className="lobby-page">
      <div className="cosmic-bg" />

      {/* 顶部 HUD */}
      <header className="lobby-header">
        <div className="lobby-brand">
          <span className="brand-mark">☁️</span>
          <div className="brand-text">
            <div className="brand-title">SKY DUEL</div>
            <div className="brand-sub">CLOUDRUNNER</div>
          </div>
        </div>

        <div className="lobby-user">
          <div className="user-stats">
            <UserStat label="LV" value={user?.level ?? 1} color="cyan" />
            <UserStat label="WINS" value={user?.totalWins ?? 0} color="purple" />
            <UserStat label="RATE" value={`${winRate}%`} color="magenta" />
          </div>
          <div
            className="user-card"
            onClick={handleProfile}
            title="点击查看个人主页"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleProfile(); }}
          >
            <div className="user-avatar">
              {(user?.nickname || user?.username || '?').charAt(0).toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-name">{user?.nickname || user?.username || 'GUEST'}</div>
              <div className="user-id">@{user?.username || 'guest'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="退出登录">
            ⏻
          </button>
        </div>
      </header>

      {/* 主体 */}
      <main className="lobby-main">
        <section className="lobby-section">
          <SectionTitle title="GAME MODE" subtitle="选择对战模式" />
          <div className="mode-grid">
            <ModeCard
              icon="⚔️"
              title="云上之巅"
              sub="Sky Duel"
              desc="一台键盘 · 双人闯关同屏"
              color="cyan"
              onClick={handleLocalGame}
              primary
            />
            <ModeCard
              icon="🎲"
              title="云端接力"
              sub="Dice Hop"
              desc="回合制掷骰 · 共享赛道跳一跳"
              color="magenta"
              onClick={handleJumpGame}
              primary
            />
            <ModeCard
              icon="🌊"
              title="浪尖踏歌"
              sub="Wave Dash"
              desc="GPGPU 动态水面 · 浪尖跳跃对决"
              color="cyan"
              onClick={handleWaveGame}
              primary
              tag="NEW"
            />
            <ModeCard
              icon="🌐"
              title="在线匹配"
              sub="Online Match"
              desc="云端联机对决（开发中）"
              color="purple"
              onClick={handleOnlineMatch}
              disabled
              tag="即将开放"
            />
            <ModeCard
              icon="🔗"
              title="创建房间"
              sub="Create Room"
              desc="生成房间号 · 邀请好友登顶"
              color="magenta"
              onClick={handleCreateRoom}
              disabled
              tag="即将开放"
            />
          </div>
        </section>

        <section className="lobby-section">
          <SectionTitle title="JOIN ROOM" subtitle="输入房间号加入好友" />
          <div className="join-room-card glass-card">
            {error && <div className="error-message">{error}</div>}
            <div className="join-room-form">
              <input
                type="text"
                className="neon-input"
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <button className="neon-btn purple" onClick={handleJoinRoom}>
                JOIN
              </button>
            </div>
          </div>
        </section>

        <section className="lobby-section lobby-section-row">
          <button className="lobby-tile" onClick={handleLeaderboard}>
            <span className="lobby-tile-icon">🏆</span>
            <span className="lobby-tile-text">
              <span className="lobby-tile-title">排行榜</span>
              <span className="lobby-tile-sub">Leaderboard</span>
            </span>
          </button>
          <button className="lobby-tile" onClick={handlePets}>
            <span className="lobby-tile-icon">🐾</span>
            <span className="lobby-tile-text">
              <span className="lobby-tile-title">我的宠物</span>
              <span className="lobby-tile-sub">My Pets</span>
            </span>
          </button>
          <div className="lobby-tile disabled">
            <span className="lobby-tile-icon">⚙️</span>
            <span className="lobby-tile-text">
              <span className="lobby-tile-title">设置</span>
              <span className="lobby-tile-sub">Coming Soon</span>
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};

/* ============ 子组件 ============ */
interface UserStatProps {
  label: string;
  value: number | string;
  color: 'cyan' | 'purple' | 'magenta';
}
const UserStat: React.FC<UserStatProps> = ({ label, value, color }) => (
  <div className={`user-stat user-stat-${color}`}>
    <div className="user-stat-label">{label}</div>
    <div className="user-stat-value">{value}</div>
  </div>
);

interface ModeCardProps {
  icon: string;
  title: string;
  sub: string;
  desc: string;
  color: 'cyan' | 'purple' | 'magenta';
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  tag?: string;
}
const ModeCard: React.FC<ModeCardProps> = ({ icon, title, sub, desc, color, onClick, primary, disabled, tag }) => (
  <button
    className={`mode-card mode-${color} ${primary ? 'is-primary' : ''} ${disabled ? 'is-disabled' : ''}`}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
  >
    {tag && <span className="mode-tag">{tag}</span>}
    <span className="mode-icon">{icon}</span>
    <div className="mode-info">
      <div className="mode-title">{title}</div>
      <div className="mode-sub">{sub}</div>
      <div className="mode-desc">{desc}</div>
    </div>
    {!disabled && <span className="mode-arrow">▶</span>}
  </button>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="section-title">
    <h3>
      <span className="section-line" />
      {title}
    </h3>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

/* 生成 6 位大写房间号 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default LobbyPage;
