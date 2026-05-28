/**
 * GamePage：3D 双人闯关赛道主页面
 * - 承载 Canvas + HUD
 * - 监听 store.phase==='finished'，2 秒后跳转到 ResultPage
 * - 离开时调用 reset() 清空状态
 */
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GameCanvas from '../components3d/GameCanvas';
import HUD from '../components3d/HUD';
import { useGameStore } from '../engine3d/gameStore';
import './GamePage.css';

const GamePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.phase);

  // 进入页面：reset；离开页面：reset
  // 同时给 body 加 no-scroll，让 3D 场景固定全屏
  useEffect(() => {
    useGameStore.getState().reset();
    document.body.classList.add('no-scroll');
    return () => {
      useGameStore.getState().reset();
      document.body.classList.remove('no-scroll');
    };
  }, []);

  // 对局结束 → 写结果到 sessionStorage，延迟跳转
  useEffect(() => {
    if (phase !== 'finished') return;
    const s = useGameStore.getState();
    const payload = {
      winner: s.winner,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      p1: {
        name: s.p1.name,
        finished: s.p1.finished,
        finishedAt: s.p1.finishedAt,
        lastCheckpoint: s.p1.lastCheckpoint,
      },
      p2: {
        name: s.p2.name,
        finished: s.p2.finished,
        finishedAt: s.p2.finishedAt,
        lastCheckpoint: s.p2.lastCheckpoint,
      },
      roomId,
    };
    sessionStorage.setItem('lastGameResult', JSON.stringify(payload));
    const t = setTimeout(() => navigate('/result/local'), 2200);
    return () => clearTimeout(t);
  }, [phase, navigate, roomId]);

  return (
    <div className="game-page game-page-3d">
      {/* 横屏提示（小屏竖屏时显示） */}
      <div className="rotate-hint">
        <div className="icon">📱</div>
        <h2>请横屏游玩</h2>
        <p>本游戏体验需要横屏模式</p>
      </div>

      {/* 返回大厅 */}
      <button className="back-to-lobby-btn" onClick={() => navigate('/lobby')}>
        ← 返回大厅
      </button>

      {/* 3D 场景 */}
      <div className="canvas-wrap">
        <GameCanvas />
      </div>

      {/* HUD 叠层 */}
      <HUD />

      {/* 胜负幕（finished 阶段短暂呈现） */}
      {phase === 'finished' && <FinishOverlay />}
    </div>
  );
};

const FinishOverlay: React.FC = () => {
  const winner = useGameStore((s) => s.winner);
  const text =
    winner === 'p1' ? 'P1 WINS!' : winner === 'p2' ? 'P2 WINS!' : 'FINISH!';
  return (
    <div className="finish-overlay">
      <div className="finish-text">{text}</div>
      <div className="finish-sub">即将进入结算...</div>
    </div>
  );
};

export default GamePage;
