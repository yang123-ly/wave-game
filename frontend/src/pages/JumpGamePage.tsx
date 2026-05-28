/**
 * 跳一跳游戏主页面：Canvas + HUD + 结算跳转
 */
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import JumpCanvas from '../components_jump/JumpCanvas';
import JumpHUD from '../components_jump/JumpHUD';
import { useJumpStore } from '../engine_jump/jumpStore';
import { TOTAL_PLATFORMS } from '../engine_jump/constants';
import './GamePage.css';

const JumpGamePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const phase = useJumpStore((s) => s.phase);

  // 进出页面：reset；同时给 body 加 no-scroll 固定全屏
  useEffect(() => {
    useJumpStore.getState().reset();
    document.body.classList.add('no-scroll');
    return () => {
      useJumpStore.getState().reset();
      document.body.classList.remove('no-scroll');
    };
  }, []);

  // 结束 → 写结算数据 + 跳转
  useEffect(() => {
    if (phase !== 'finished') return;
    const s = useJumpStore.getState();
    // 复用 ResultPage 的 GameResultPayload 结构
    // 把 platformIndex 映射成 lastCheckpoint（占位语义统一）
    const payload = {
      winner: s.winner,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      p1: {
        name: s.p1.name,
        finished: s.p1.finished,
        finishedAt: s.p1.finishedAt,
        lastCheckpoint: s.p1.platformIndex,
      },
      p2: {
        name: s.p2.name,
        finished: s.p2.finished,
        finishedAt: s.p2.finishedAt,
        lastCheckpoint: s.p2.platformIndex,
      },
      // 跳一跳的"总段数"是 TOTAL_PLATFORMS-1（终点是 N-1）
      totalSegments: TOTAL_PLATFORMS - 1,
      gameType: 'jump' as const,
      roomId,
    };
    sessionStorage.setItem('lastGameResult', JSON.stringify(payload));
    const t = setTimeout(() => navigate('/result/local'), 2500);
    return () => clearTimeout(t);
  }, [phase, navigate, roomId]);

  return (
    <div className="game-page game-page-3d">
      {/* 横屏提示 */}
      <div className="rotate-hint">
        <div className="icon">📱</div>
        <h2>请横屏游玩</h2>
        <p>本游戏体验需要横屏模式</p>
      </div>

      <button className="back-to-lobby-btn" onClick={() => navigate('/lobby')}>
        ← 返回大厅
      </button>

      <div className="canvas-wrap">
        <JumpCanvas />
      </div>

      <JumpHUD />

      {phase === 'finished' && <FinishOverlay />}
    </div>
  );
};

const FinishOverlay: React.FC = () => {
  const winner = useJumpStore((s) => s.winner);
  const text = winner === 'p1' ? 'P1 WINS!' : winner === 'p2' ? 'P2 WINS!' : 'FINISH!';
  return (
    <div className="finish-overlay">
      <div className="finish-text">{text}</div>
      <div className="finish-sub">即将进入结算...</div>
    </div>
  );
};

export default JumpGamePage;
