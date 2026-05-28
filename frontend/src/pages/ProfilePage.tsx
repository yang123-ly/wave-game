/**
 * 个人主页
 * 左：3D 形象（Michelle.glb，自带 SambaDance 跳舞动画）
 * 右：用户资料 + 战绩 + 我的宠物入口
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileCanvas from '../components_profile/ProfileCanvas';
import './ProfilePage.css';

/** 可选模型列表 */
const MODELS = [
  {
    id: 'michelle',
    name: 'Michelle (P1)',
    sub: 'Mixamo · 桑巴舞',
    url: '/models/Michelle.glb',
    scale: 1.4,
    positionY: 0,
  },
  {
    id: 'dropkick',
    name: 'Drop Kick (P2)',
    sub: 'Mixamo · 霹雳舞',
    url: '/models/DropKick.fbx',
    scale: 0.014,
    positionY: 0.9,
  },
];

/** 每个模型对应的动作列表 + extraAnimations */
const MODEL_ACTIONS: Record<string, { actions: { id: string; clip: string; name: string; icon: string; tip: string }[]; extras: { name: string; url: string }[] }> = {
  michelle: {
    actions: [
      { id: 'dance', clip: 'SambaDance', name: 'Dancing', icon: '💃', tip: '桑巴舞 (GLB 内置)' },
      { id: 'jump', clip: 'Jump', name: 'Jump', icon: '🦘', tip: '跳跃 (JumpingDown.fbx)' },
    ],
    extras: [{ name: 'Jump', url: '/models/JumpingDown.fbx' }],
  },
  dropkick: {
    actions: [
      { id: 'breakdance', clip: 'Breakdance1990', name: 'Breakdance', icon: '🕺', tip: '霹雳舞 1990' },
      { id: 'jump', clip: 'Jump', name: 'Jump', icon: '🦘', tip: '跳跃 (JumpingDown.fbx)' },
    ],
    extras: [
      { name: 'Breakdance1990', url: '/models/Breakdance1990.fbx' },
      { name: 'Jump', url: '/models/JumpingDown.fbx' },
    ],
  },
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentModelId, setCurrentModelId] = useState(MODELS[0].id);
  const [actionId, setActionId] = useState<string>('dance');

  const currentModel = useMemo(
    () => MODELS.find((m) => m.id === currentModelId) ?? MODELS[0],
    [currentModelId],
  );

  const modelConfig = MODEL_ACTIONS[currentModelId] ?? MODEL_ACTIONS.michelle;
  const currentActions = modelConfig.actions;
  const extraAnimations = modelConfig.extras;

  // 切换模型时重置动作为该模型的第一个
  const handleModelSwitch = (id: string) => {
    setCurrentModelId(id);
    const cfg = MODEL_ACTIONS[id] ?? MODEL_ACTIONS.michelle;
    setActionId(cfg.actions[0].id);
  };

  const animationName = currentActions.find((a) => a.id === actionId)?.clip ?? currentActions[0].clip;

  if (!user) {
    return (
      <div className="profile-page-empty">
        <p>请先登录</p>
        <button onClick={() => navigate('/')}>返回登录</button>
      </div>
    );
  }

  const totalGames = (user.totalWins ?? 0) + (user.totalLosses ?? 0);
  const winRate = totalGames > 0 ? Math.round(((user.totalWins ?? 0) / totalGames) * 100) : 0;

  return (
    <div className="profile-page">
      <div className="cosmic-bg" />

      {/* 顶部 nav */}
      <header className="profile-nav">
        <button className="profile-back" onClick={() => navigate('/lobby')}>
          ← 返回大厅
        </button>
        <div className="profile-nav-title">PERSONAL PROFILE</div>
        <button className="profile-logout" onClick={() => { logout(); navigate('/'); }}>
          ⏻ 退出
        </button>
      </header>

      <main className="profile-main">
        {/* 左侧：3D 形象 */}
        <section className="profile-left">
          <div className="profile-3d-wrap">
            <ProfileCanvas
              modelUrl={currentModel.url}
              scale={currentModel.scale}
              positionY={currentModel.positionY}
              animationName={animationName}
              extraAnimations={extraAnimations}
            />
          </div>
          <div className="profile-model-info">
            <div className="profile-model-name">{currentModel.name}</div>
            <div className="profile-model-sub">{currentModel.sub}</div>
            <div className="profile-model-tip">🖱️ 拖动旋转 · 滚轮缩放</div>
          </div>

          {/* 动作切换 */}
          <div className="profile-action-bar">
            {currentActions.map((a) => (
              <button
                key={a.id}
                className={`action-btn ${actionId === a.id ? 'is-active' : ''}`}
                onClick={() => setActionId(a.id)}
                title={a.tip}
              >
                <span className="action-icon">{a.icon}</span>
                <span className="action-name">{a.name}</span>
              </button>
            ))}
          </div>

          {MODELS.length > 1 && (
            <div className="profile-model-switch">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`model-pill ${m.id === currentModelId ? 'is-active' : ''}`}
                  onClick={() => handleModelSwitch(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 右侧：资料 + 战绩 */}
        <section className="profile-right">
          {/* 用户卡 */}
          <div className="profile-card glass-card">
            <div className="profile-avatar-big">
              {(user.nickname || user.username).charAt(0).toUpperCase()}
            </div>
            <div className="profile-meta">
              <div className="profile-name">{user.nickname || user.username}</div>
              <div className="profile-username">@{user.username}</div>
              <div className="profile-id">ID #{user.id}</div>
            </div>
          </div>

          {/* 战绩面板 */}
          <div className="profile-stats glass-card">
            <h3 className="stats-title">
              <span className="stats-line" />
              BATTLE RECORD
            </h3>
            <div className="stats-grid">
              <StatBlock label="等级" value={user.level ?? 1} color="cyan" suffix="LV" />
              <StatBlock label="总胜场" value={user.totalWins ?? 0} color="purple" />
              <StatBlock label="总负场" value={user.totalLosses ?? 0} color="magenta" />
              <StatBlock label="胜率" value={`${winRate}%`} color="cyan" />
              <StatBlock label="总场次" value={totalGames} color="purple" />
              <StatBlock label="连胜" value={0} color="magenta" suffix="🔥" />
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="profile-quick">
            <button className="quick-tile" onClick={() => navigate('/pets')}>
              <span className="quick-icon">🐾</span>
              <span className="quick-text">
                <span className="quick-title">我的宠物</span>
                <span className="quick-sub">My Pets</span>
              </span>
            </button>
            <button className="quick-tile" onClick={() => navigate('/leaderboard')}>
              <span className="quick-icon">🏆</span>
              <span className="quick-text">
                <span className="quick-title">排行榜</span>
                <span className="quick-sub">Leaderboard</span>
              </span>
            </button>
            <button className="quick-tile" onClick={() => navigate('/lobby')}>
              <span className="quick-icon">⚔️</span>
              <span className="quick-text">
                <span className="quick-title">开始对战</span>
                <span className="quick-sub">Battle</span>
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

/* ============ 子组件 ============ */
interface StatBlockProps {
  label: string;
  value: number | string;
  color: 'cyan' | 'purple' | 'magenta';
  suffix?: string;
}
const StatBlock: React.FC<StatBlockProps> = ({ label, value, color, suffix }) => (
  <div className={`stat-block stat-${color}`}>
    <div className="stat-value">
      {value}
      {suffix && <span className="stat-suffix">{suffix}</span>}
    </div>
    <div className="stat-label">{label}</div>
  </div>
);

export default ProfilePage;
