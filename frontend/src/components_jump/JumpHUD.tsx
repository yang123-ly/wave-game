/**
 * 跳一跳 HUD：进度条、回合提示、骰子按钮、buff、事件横幅、准备屏
 */
import React, { useEffect } from 'react';
import { useJumpStore } from '../engine_jump/jumpStore';
import { TOTAL_PLATFORMS } from '../engine_jump/constants';
import { P1_COLOR, P2_COLOR } from '../engine3d/constants';
import type { PlayerSide } from '../engine3d/types';
import './JumpHUD.css';

const JumpHUD: React.FC = () => {
  const phase = useJumpStore((s) => s.phase);
  const currentTurn = useJumpStore((s) => s.currentTurn);
  const p1 = useJumpStore((s) => s.p1);
  const p2 = useJumpStore((s) => s.p2);
  const eventBanner = useJumpStore((s) => s.eventBanner);
  const rollDice = useJumpStore((s) => s.rollDice);

  // 全局键盘监听：Space → P1 投骰，Enter → P2 投骰
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'p1_turn' && phase !== 'p2_turn') return;
      if (e.code === 'Space' && currentTurn === 'p1') {
        e.preventDefault();
        rollDice('p1');
      } else if (e.code === 'Enter' && currentTurn === 'p2') {
        e.preventDefault();
        rollDice('p2');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, currentTurn, rollDice]);

  const p1Progress = (p1.platformIndex / (TOTAL_PLATFORMS - 1)) * 100;
  const p2Progress = (p2.platformIndex / (TOTAL_PLATFORMS - 1)) * 100;

  return (
    <div className="jump-hud-root">
      {/* 顶部双方进度 */}
      <div className="jump-hud-top">
        <PlayerCard
          side="p1"
          color={P1_COLOR}
          name={p1.name}
          progress={p1Progress}
          platformIndex={p1.platformIndex}
          shieldCount={p1.shieldCount}
          bonusNextTurn={p1.bonusNextTurn}
          isTurn={currentTurn === 'p1'}
          finished={p1.finished}
        />
        <div className="jump-hud-versus">VS</div>
        <PlayerCard
          side="p2"
          color={P2_COLOR}
          name={p2.name}
          progress={p2Progress}
          platformIndex={p2.platformIndex}
          shieldCount={p2.shieldCount}
          bonusNextTurn={p2.bonusNextTurn}
          isTurn={currentTurn === 'p2'}
          finished={p2.finished}
        />
      </div>

      {/* 中央回合提示 */}
      {(phase === 'p1_turn' || phase === 'p2_turn') && (
        <TurnIndicator side={currentTurn!} onRoll={() => rollDice(currentTurn!)} />
      )}

      {/* 事件横幅（resolving 阶段） */}
      {phase === 'resolving' && eventBanner && (
        <div className="jump-event-banner" key={`${eventBanner.title}-${Date.now()}`}>
          <div className="jump-event-icon">{eventBanner.icon}</div>
          <div className="jump-event-title">{eventBanner.title}</div>
          <div className="jump-event-detail">{eventBanner.detail}</div>
        </div>
      )}

      {/* 准备屏 */}
      {phase === 'idle' && <ReadyOverlay />}
    </div>
  );
};

/* ============ 准备屏 ============ */
const ReadyOverlay: React.FC = () => {
  const ready = useJumpStore((s) => s.ready);
  const setReady = useJumpStore((s) => s.setReady);
  return (
    <div className="jump-ready">
      <h1 className="jump-ready-title">
        <span style={{ color: P1_COLOR }}>DICE</span>{' '}
        <span style={{ color: P2_COLOR }}>HOP</span>
      </h1>
      <p className="jump-ready-sub">☁️ 云端接力 · 双人跳一跳</p>
      <div className="jump-ready-cards">
        <ReadyCard side="p1" color={P1_COLOR} ready={ready.p1} onReady={() => setReady('p1', true)} />
        <div className="jump-ready-vs">VS</div>
        <ReadyCard side="p2" color={P2_COLOR} ready={ready.p2} onReady={() => setReady('p2', true)} />
      </div>
      <div className="jump-ready-controls">
        <div className="jump-ctrl" style={{ borderColor: P1_COLOR, color: P1_COLOR }}>
          <strong>P1</strong>
          <span>Space 投骰</span>
        </div>
        <div className="jump-ctrl" style={{ borderColor: P2_COLOR, color: P2_COLOR }}>
          <strong>P2</strong>
          <span>Enter 投骰</span>
        </div>
      </div>
      <p className="jump-ready-tip">
        共享赛道 · 共 {TOTAL_PLATFORMS} 块板 · 先抵达终点者获胜
      </p>
    </div>
  );
};

const ReadyCard: React.FC<{
  side: PlayerSide;
  color: string;
  ready: boolean;
  onReady: () => void;
}> = ({ side, color, ready, onReady }) => (
  <div className="jump-ready-card" style={{ borderColor: color }}>
    <div className="jump-ready-side" style={{ color }}>
      {side === 'p1' ? 'PLAYER 1' : 'PLAYER 2'}
    </div>
    <div className="jump-ready-icon" style={{ color }}>
      {side === 'p1' ? '🎲' : '🎯'}
    </div>
    <button
      className={`jump-ready-btn ${ready ? 'is-ready' : ''}`}
      style={{
        borderColor: color,
        color: ready ? '#05050a' : color,
        background: ready ? color : 'transparent',
      }}
      onClick={onReady}
      disabled={ready}
    >
      {ready ? '✓ READY' : 'READY?'}
    </button>
  </div>
);

/* ============ 底部回合提示 + 投骰按钮（不挡住 3D 画面） ============ */
const TurnIndicator: React.FC<{ side: PlayerSide; onRoll: () => void }> = ({ side, onRoll }) => {
  const color = side === 'p1' ? P1_COLOR : P2_COLOR;
  const label = side === 'p1' ? 'P1' : 'P2';
  const key = side === 'p1' ? 'SPACE' : 'ENTER';
  return (
    <div
      className="jump-turn-indicator"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(5,5,10,0.7)',
        backdropFilter: 'blur(6px)',
        borderRadius: '12px',
        padding: '8px 20px',
        border: `1px solid ${color}`,
        zIndex: 100,
      }}
    >
      <span style={{ color, fontWeight: 700, fontSize: '14px' }}>{label} 回合</span>
      <button
        className="jump-roll-btn"
        style={{ borderColor: color, color, padding: '6px 14px', fontSize: '13px' }}
        onClick={onRoll}
      >
        🎲 投骰
      </button>
      <span style={{ color: '#999', fontSize: '11px' }}>{key}</span>
    </div>
  );
};

/* ============ 顶部玩家卡片 ============ */
interface PlayerCardProps {
  side: PlayerSide;
  color: string;
  name: string;
  progress: number;
  platformIndex: number;
  shieldCount: number;
  bonusNextTurn: number;
  isTurn: boolean;
  finished: boolean;
}
const PlayerCard: React.FC<PlayerCardProps> = ({
  color,
  name,
  progress,
  platformIndex,
  shieldCount,
  bonusNextTurn,
  isTurn,
  finished,
}) => (
  <div
    className={`jump-player-card ${isTurn ? 'is-turn' : ''} ${finished ? 'is-finished' : ''}`}
    style={{ borderColor: color, boxShadow: isTurn ? `0 0 16px ${color}` : 'none' }}
  >
    <div className="jump-player-head">
      <span className="jump-player-name" style={{ color }}>{name}</span>
      <div className="jump-player-buffs">
        {Array.from({ length: shieldCount }).map((_, i) => (
          <span key={i} className="jump-buff" title="护盾">🛡️</span>
        ))}
        {bonusNextTurn > 0 && (
          <span className="jump-buff" title={`下回合 +${bonusNextTurn}`}>⚡+{bonusNextTurn}</span>
        )}
      </div>
    </div>
    <div className="jump-progress">
      <div
        className="jump-progress-fill"
        style={{
          width: `${progress}%`,
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
    <div className="jump-progress-text">
      {finished ? (
        <span style={{ color }}>🏁 FINISH</span>
      ) : (
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
          {platformIndex} / {TOTAL_PLATFORMS - 1}
        </span>
      )}
    </div>
  </div>
);

export default JumpHUD;
