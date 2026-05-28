/**
 * 浪尖踏歌 - 主页面（跳一跳海洋模式）
 * Canvas + HUD + 结算跳转
 */
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WaveCanvas from '../components_wave/WaveCanvas';
import WaveHUD from '../components_wave/WaveHUD';
import { useWaveStore } from '../engine_wave/waveStore';
import { TOTAL_PLATFORMS } from '../engine_wave/constants';
import './GamePage.css';

const WaveGamePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const phase = useWaveStore((s) => s.phase);
  const winner = useWaveStore((s) => s.winner);
  const p1 = useWaveStore((s) => s.p1);
  const p2 = useWaveStore((s) => s.p2);

  /** 进出页面：reset + body 锁滚 */
  useEffect(() => {
    useWaveStore.getState().reset();
    document.body.classList.add('no-scroll');
    return () => {
      useWaveStore.getState().reset();
      document.body.classList.remove('no-scroll');
    };
  }, []);

  /** 结束 → 写结算数据 + 跳转 ResultPage */
  useEffect(() => {
    if (phase !== 'finished') return;
    const payload = {
      gameMode: 'wave',
      roomId: roomId ?? 'wave',
      totalPlatforms: TOTAL_PLATFORMS,
      players: [
        { id: 'p1', name: p1.name, position: p1.platformIndex },
        { id: 'p2', name: p2.name, position: p2.platformIndex },
      ],
      winnerId: winner ?? 'tie',
      finishedAt: new Date().toISOString(),
    };
    const sessionId = `wave_${Date.now()}`;
    sessionStorage.setItem(`result_${sessionId}`, JSON.stringify(payload));
    const t = setTimeout(() => navigate(`/result/${sessionId}`), 2500);
    return () => clearTimeout(t);
  }, [phase, winner, p1, p2, navigate, roomId]);

  return (
    <div className="game-page" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <WaveCanvas />
      <WaveHUD />
    </div>
  );
};

export default WaveGamePage;
