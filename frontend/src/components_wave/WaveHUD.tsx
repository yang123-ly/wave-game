/**
 * 浪尖踏歌 - HUD（跳一跳海洋模式）
 * - 顶部：双玩家位置卡 + 中央标题
 * - 中央：事件横幅 / 掷骰子按钮 / 游戏结束
 * - 底部：操作提示
 */
import React, { useEffect, useState } from 'react';
import { useWaveStore } from '../engine_wave/waveStore';
import { P1_COLOR, P2_COLOR, TOTAL_PLATFORMS, getWavePlatformPosition } from '../engine_wave/constants';
import { cameraParams } from './WaveFollowCamera';
import './WaveHUD.css';

const WaveHUD: React.FC = () => {
  const phase = useWaveStore((s) => s.phase);
  const currentTurn = useWaveStore((s) => s.currentTurn);
  const eventBanner = useWaveStore((s) => s.eventBanner);
  const winner = useWaveStore((s) => s.winner);
  const p1 = useWaveStore((s) => s.p1);
  const p2 = useWaveStore((s) => s.p2);
  const rollDice = useWaveStore((s) => s.rollDice);
  const setReady = useWaveStore((s) => s.setReady);
  const reset = useWaveStore((s) => s.reset);

  // 自动双方 ready（简化开局）
  useEffect(() => {
    if (phase === 'idle') {
      setTimeout(() => {
        setReady('p1', true);
        setReady('p2', true);
      }, 500);
    }
  }, [phase, setReady]);

  const handleRoll = () => {
    if (!currentTurn) return;
    rollDice(currentTurn);
  };

  const isRollPhase = phase === 'p1_turn' || phase === 'p2_turn';
  const turnColor = currentTurn === 'p1' ? P1_COLOR : P2_COLOR;
  const turnName = currentTurn === 'p1' ? p1.name : p2.name;

  return (
    <div className="wave-hud">
      {/* 顶部位置卡 */}
      <div className="wave-top">
        <PlayerCard
          name={p1.name}
          position={p1.platformIndex}
          color={P1_COLOR}
          active={currentTurn === 'p1' && phase !== 'finished'}
          side="left"
        />
        <div className="wave-round-badge">
          <div className="wave-round-num">🌊 浪尖踏歌</div>
          <div className="wave-round-sub">终点 {TOTAL_PLATFORMS - 1} 格</div>
        </div>
        <PlayerCard
          name={p2.name}
          position={p2.platformIndex}
          color={P2_COLOR}
          active={currentTurn === 'p2' && phase !== 'finished'}
          side="right"
        />
      </div>

      {/* 掷骰子按钮 */}
      {isRollPhase && (
        <div className="wave-turn-banner">
          <div className="wave-turn-name" style={{ color: turnColor }}>
            {turnName} 的回合
          </div>
          <button
            className="wave-roll-btn"
            style={{ borderColor: turnColor, color: turnColor }}
            onClick={handleRoll}
          >
            🎲 掷骰子
          </button>
        </div>
      )}

      {/* 骰子滚动中 */}
      {phase === 'rolling' && (
        <div className="wave-turn-banner">
          <div className="wave-jumping-text">🎲 滚动中...</div>
        </div>
      )}

      {/* 事件横幅 */}
      {phase === 'resolving' && eventBanner && (
        <div className="wave-flash is-hit">
          <span>{eventBanner.icon} {eventBanner.title}</span>
          <span className="wave-flash-delta">{eventBanner.detail}</span>
        </div>
      )}

      {/* 游戏结束 */}
      {phase === 'finished' && (
        <div className="wave-turn-banner">
          <div className="wave-turn-name" style={{ color: winner === 'p1' ? P1_COLOR : P2_COLOR }}>
            🏆 {winner === 'p1' ? p1.name : p2.name} 胜利！
          </div>
          <button className="wave-roll-btn" style={{ borderColor: '#ffd60a', color: '#ffd60a' }} onClick={reset}>
            🔄 再来一局
          </button>
        </div>
      )}

      {/* 底部提示 */}
      {isRollPhase && (
        <div className="wave-bottom-tip">
          🎲 点击掷骰子，骰几走几，先到终点获胜！
        </div>
      )}

      {/* 右上角步骤图 */}
      <TrackMiniMap p1Index={p1.platformIndex} p2Index={p2.platformIndex} />

      {/* 左下角相机参数面板 */}
      <CameraParamsPanel />
    </div>
  );
};

/* ============ 子组件 ============ */
interface PlayerCardProps {
  name: string;
  position: number;
  color: string;
  active: boolean;
  side: 'left' | 'right';
}
const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  color,
  active,
  side,
}) => (
  <div
    className={`wave-pcard wave-pcard-${side} ${active ? 'is-active' : ''}`}
    style={{ borderColor: color, color }}
  >
    <div className="wave-pcard-name">{name}</div>
    <div className="wave-pcard-score">{position} / {TOTAL_PLATFORMS - 1}</div>
  </div>
);

/* ============ 右上角 2D 俯视小地图 ============ */

interface TrackMiniMapProps {
  p1Index: number;
  p2Index: number;
}

const TrackMiniMap: React.FC<TrackMiniMapProps> = ({ p1Index, p2Index }) => {
  // 计算所有格子的 XZ 坐标，映射到 SVG 空间
  const positions = Array.from({ length: TOTAL_PLATFORMS }, (_, i) => getWavePlatformPosition(i));
  const allX = positions.map((p) => p[0]);
  const allZ = positions.map((p) => p[2]);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minZ = Math.min(...allZ);
  const maxZ = Math.max(...allZ);
  const padding = 20;
  const svgW = 180;
  const svgH = 240;

  const mapX = (x: number) => padding + ((x - minX) / (maxX - minX || 1)) * (svgW - padding * 2);
  const mapY = (z: number) => padding + ((z - minZ) / (maxZ - minZ || 1)) * (svgH - padding * 2);

  // 连线路径
  const pathD = positions.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p[0])} ${mapY(p[2])}`).join(' ');

  const p1Pos = positions[p1Index];
  const p2Pos = positions[p2Index];

  return (
    <div className="wave-minimap">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* 路径线 */}
        <path d={pathD} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 3" />
        {/* 格子点 */}
        {positions.map((p, i) => (
          <circle
            key={i}
            cx={mapX(p[0])}
            cy={mapY(p[2])}
            r={i === 0 || i === TOTAL_PLATFORMS - 1 ? 6 : 4}
            fill={i === 0 ? '#86efac' : i === TOTAL_PLATFORMS - 1 ? '#fbbf24' : 'rgba(255,255,255,0.4)'}
          />
        ))}
        {/* P2 位置 */}
        <circle cx={mapX(p2Pos[0])} cy={mapY(p2Pos[2])} r={9} fill={P2_COLOR} stroke="#fff" strokeWidth="1.5" />
        <text x={mapX(p2Pos[0])} y={mapY(p2Pos[2]) + 4} textAnchor="middle" fill="#000" fontSize="9" fontWeight="bold">2</text>
        {/* P1 位置 */}
        <circle cx={mapX(p1Pos[0])} cy={mapY(p1Pos[2])} r={9} fill={P1_COLOR} stroke="#fff" strokeWidth="1.5" />
        <text x={mapX(p1Pos[0])} y={mapY(p1Pos[2]) + 4} textAnchor="middle" fill="#000" fontSize="9" fontWeight="bold">1</text>
        {/* 起点/终点标记 */}
        <text x={mapX(positions[0][0])} y={mapY(positions[0][2]) - 10} textAnchor="middle" fill="#86efac" fontSize="10">🏖️</text>
        <text x={mapX(positions[TOTAL_PLATFORMS - 1][0])} y={mapY(positions[TOTAL_PLATFORMS - 1][2]) - 10} textAnchor="middle" fill="#fbbf24" fontSize="10">🏁</text>
      </svg>
    </div>
  );
};

/* ============ 左下角相机参数调节面板 ============ */
const CameraParamsPanel: React.FC = () => {
  const [dist, setDist] = useState(cameraParams.followDist);
  const [height, setHeight] = useState(cameraParams.followHeight);
  const [speed, setSpeed] = useState(cameraParams.orbitSpeed);

  const handleDist = (v: number) => { setDist(v); cameraParams.followDist = v; };
  const handleHeight = (v: number) => { setHeight(v); cameraParams.followHeight = v; };
  const handleSpeed = (v: number) => { setSpeed(v); cameraParams.orbitSpeed = v; };

  return (
    <div className="wave-params-panel">
      <div className="wave-params-title">📷 相机参数</div>
      <label>
        <span>距离: {dist.toFixed(1)}</span>
        <input type="range" min="5" max="40" step="0.5" value={dist} onChange={(e) => handleDist(+e.target.value)} />
      </label>
      <label>
        <span>高度: {height.toFixed(1)}</span>
        <input type="range" min="1" max="20" step="0.5" value={height} onChange={(e) => handleHeight(+e.target.value)} />
      </label>
      <label>
        <span>旋转: {speed.toFixed(2)} rad/s</span>
        <input type="range" min="0" max="2" step="0.05" value={speed} onChange={(e) => handleSpeed(+e.target.value)} />
      </label>
    </div>
  );
};

export default WaveHUD;
