/**
 * 全局游戏 HUD（叠加在 Canvas 之上的 React 层）
 * - 顶部：双方信息（名称、状态、道具槽）
 * - 中央：倒计时数字
 * - 底部：进度条（距离终点）
 * - 复活遮罩
 */
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../engine3d/gameStore';
import { GOAL_Z, P1_COLOR, P2_COLOR, START_Z } from '../engine3d/constants';
import type { PlayerSide, PowerUpKind } from '../engine3d/types';
import './HUD.css';

const POWERUP_ICON: Record<PowerUpKind, string> = {
  speed: '⚡',
  shield: '🛡️',
  blast: '💥',
};

const HUD: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const countdown = useGameStore((s) => s.countdown);
  const p1 = useGameStore((s) => s.p1);
  const p2 = useGameStore((s) => s.p2);

  /* ============ 倒计时驱动 ============ */
  useEffect(() => {
    if (phase !== 'countdown') return;
    const id = setInterval(() => {
      useGameStore.getState().tickCountdown();
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // 进度（玩家在赛道上的相对位置，0..1）
  const calcProgress = (z: number) => {
    const total = START_Z - GOAL_Z;
    const traveled = START_Z - z;
    return Math.max(0, Math.min(1, traveled / total));
  };
  const p1Progress = calcProgress(p1.position[2]);
  const p2Progress = calcProgress(p2.position[2]);

  return (
    <div className="hud-root">
      {/* 顶部双方状态条 */}
      <div className="hud-top">
        <PlayerCard
          side="p1"
          color={P1_COLOR}
          progress={p1Progress}
          shield={p1.hasShield}
          boostActive={p1.speedBoostUntil > Date.now()}
          activePowerUp={p1.activePowerUp}
          finished={p1.finished}
          respawnUntil={p1.respawnUntil}
        />
        <div className="hud-versus">VS</div>
        <PlayerCard
          side="p2"
          color={P2_COLOR}
          progress={p2Progress}
          shield={p2.hasShield}
          boostActive={p2.speedBoostUntil > Date.now()}
          activePowerUp={p2.activePowerUp}
          finished={p2.finished}
          respawnUntil={p2.respawnUntil}
        />
      </div>

      {/* 中央倒计时 */}
      {phase === 'countdown' && (
        <div className="hud-countdown">
          <div className="hud-countdown-num" key={countdown}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <div className="hud-countdown-sub">准备出发</div>
        </div>
      )}

      {/* 准备阶段：双方 Ready */}
      {phase === 'idle' && <ReadyOverlay />}

      {/* 操作提示（仅在 playing 开局 5 秒内显示） */}
      {phase === 'playing' && <ControlsHint />}
    </div>
  );
};

/* ============ Ready 弹层 ============ */
const ReadyOverlay: React.FC = () => {
  const ready = useGameStore((s) => s.ready);
  const setReady = useGameStore((s) => s.setReady);

  return (
    <div className="hud-ready">
      <h1 className="hud-ready-title">
        <span style={{ color: P1_COLOR }}>SKY</span>{' '}
        <span style={{ color: P2_COLOR }}>DUEL</span>
      </h1>
      <p className="hud-ready-sub">☁️ 云上之巅 · 双人对决</p>
      <div className="hud-ready-cards">
        <ReadyCard side="p1" color={P1_COLOR} ready={ready.p1} onReady={() => setReady('p1', true)} />
        <div className="hud-ready-vs">VS</div>
        <ReadyCard side="p2" color={P2_COLOR} ready={ready.p2} onReady={() => setReady('p2', true)} />
      </div>
      <div className="hud-ready-controls">
        <div className="ctrl-block" style={{ borderColor: P1_COLOR, color: P1_COLOR }}>
          <strong>P1</strong>
          <span>WASD · Space 跳 · F 技能</span>
        </div>
        <div className="ctrl-block" style={{ borderColor: P2_COLOR, color: P2_COLOR }}>
          <strong>P2</strong>
          <span>方向键 · Enter 跳 · Shift 技能</span>
        </div>
      </div>
    </div>
  );
};

const ReadyCard: React.FC<{
  side: PlayerSide;
  color: string;
  ready: boolean;
  onReady: () => void;
}> = ({ side, color, ready, onReady }) => (
  <div className="ready-card" style={{ borderColor: color }}>
    <div className="ready-side" style={{ color }}>
      {side === 'p1' ? 'PLAYER 1' : 'PLAYER 2'}
    </div>
    <div className="ready-icon" style={{ color }}>
      {side === 'p1' ? '🛹' : '🪂'}
    </div>
    <button
      className={`ready-btn ${ready ? 'is-ready' : ''}`}
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

/* ============ 玩家信息卡 ============ */
interface PlayerCardProps {
  side: PlayerSide;
  color: string;
  progress: number;
  shield: boolean;
  boostActive: boolean;
  activePowerUp: PowerUpKind | null;
  finished: boolean;
  respawnUntil: number;
}
const PlayerCard: React.FC<PlayerCardProps> = ({
  side,
  color,
  progress,
  shield,
  boostActive,
  activePowerUp,
  finished,
  respawnUntil,
}) => {
  const respawning = respawnUntil > 0 && respawnUntil > Date.now();
  const respawnRemainSec = respawning ? Math.ceil((respawnUntil - Date.now()) / 1000) : 0;
  return (
    <div className={`player-card ${finished ? 'is-finished' : ''}`} style={{ borderColor: color }}>
      <div className="player-card-head">
        <span className="player-label" style={{ color }}>
          {side === 'p1' ? 'P1' : 'P2'}
        </span>
        <div className="player-buffs">
          {boostActive && <span className="buff">⚡</span>}
          {shield && <span className="buff">🛡️</span>}
          {activePowerUp && (
            <span className="buff slot" title="按 F/Shift 释放">
              {POWERUP_ICON[activePowerUp]}
            </span>
          )}
        </div>
      </div>
      <div className="player-progress">
        <div
          className="player-progress-fill"
          style={{
            width: `${progress * 100}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
      <div className="player-status">
        {finished ? (
          <span style={{ color }}>🏁 FINISH</span>
        ) : respawning ? (
          <span style={{ color: '#ff4d4d' }}>💀 复活中 {respawnRemainSec}s</span>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(progress * 100)}%</span>
        )}
      </div>
    </div>
  );
};

/* ============ 操作提示 ============ */
const ControlsHint: React.FC = () => {
  const startedAt = useGameStore((s) => s.startedAt);
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (!startedAt) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [startedAt]);
  if (!show) return null;
  return (
    <div className="hud-controls-hint">
      <span>P1: WASD + Space + F</span>
      <span>P2: ← → ↑ ↓ + Enter + Shift</span>
    </div>
  );
};

export default HUD;
