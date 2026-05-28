import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResultPage.css';

/** 通用 3D 双人游戏的结算数据结构（云上之巅 / 云端接力 共用） */
interface PlayerResultData {
  name: string;
  finished: boolean;
  finishedAt: number | null;
  /** 最大已通过的检查点 / 板编号（语义随游戏不同） */
  lastCheckpoint: number;
}

interface GameResultPayload {
  winner: 'p1' | 'p2' | null;
  startedAt: number | null;
  finishedAt: number | null;
  p1: PlayerResultData;
  p2: PlayerResultData;
  /** 总检查点数（云上之巅默认 6；跳一跳传 19） */
  totalSegments?: number;
  /** 游戏类型，用于显示文案差异 */
  gameType?: 'sky' | 'jump';
  roomId?: string;
}

const DEFAULT_TOTAL_SEGMENTS = 6;

const ResultPage: React.FC = () => {
  const navigate = useNavigate();

  const result = useMemo<GameResultPayload | null>(() => {
    const raw = sessionStorage.getItem('lastGameResult');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GameResultPayload;
    } catch {
      return null;
    }
  }, []);

  if (!result) {
    return (
      <div className="result-page">
        <div className="cosmic-bg" />
        <div className="result-empty glass-card">
          <h2 className="result-empty-title">NO DATA</h2>
          <p>暂无对局数据，请先开始一局游戏</p>
          <button className="neon-btn" onClick={() => navigate('/lobby')}>
            返回大厅
          </button>
        </div>
      </div>
    );
  }

  const calcTime = (p: PlayerResultData) =>
    p.finishedAt && result.startedAt ? p.finishedAt - result.startedAt : null;

  const p1Time = calcTime(result.p1);
  const p2Time = calcTime(result.p2);

  const totalSegments = result.totalSegments ?? DEFAULT_TOTAL_SEGMENTS;
  const denom = Math.max(1, totalSegments);
  // 进度（已通过检查点 / 总段）
  const p1Progress = result.p1.finished
    ? 100
    : Math.min(100, Math.round((result.p1.lastCheckpoint / denom) * 100));
  const p2Progress = result.p2.finished
    ? 100
    : Math.min(100, Math.round((result.p2.lastCheckpoint / denom) * 100));

  const winnerTitle =
    result.winner === null ? 'DRAW' : result.winner === 'p1' ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS';

  // 时间差（仅当双方都完成才显示）
  const timeGapText =
    p1Time != null && p2Time != null
      ? `${(Math.abs(p1Time - p2Time) / 1000).toFixed(2)}s`
      : null;

  // 跳一跳：用步数代替时间显示
  const isJump = result.gameType === 'jump';

  const handlePlayAgain = () => {
    sessionStorage.removeItem('lastGameResult');
    navigate(isJump ? '/jump/local' : '/game/local');
  };

  return (
    <div className="result-page">
      <div className="cosmic-bg" />

      <div className="result-banner">
        <div className={`winner-text ${result.winner ?? 'draw'}`}>{winnerTitle}</div>
        <div className="winner-sub">
          {result.winner === null
            ? '势均力敌!'
            : isJump
              ? '掷骰称王，登顶云端!'
              : '冲破云海，独占巅峰!'}
        </div>
        {timeGapText && !isJump && (
          <div className="winner-gap">领先优势 · {timeGapText}</div>
        )}
      </div>

      <div className="result-grid">
        <PlayerResultCard
          side="p1"
          label="PLAYER 1"
          name={result.p1.name}
          time={p1Time}
          finished={result.p1.finished}
          progress={p1Progress}
          checkpoint={result.p1.lastCheckpoint}
          totalSegments={totalSegments}
          isWinner={result.winner === 'p1'}
          isJump={isJump}
        />
        <PlayerResultCard
          side="p2"
          label="PLAYER 2"
          name={result.p2.name}
          time={p2Time}
          finished={result.p2.finished}
          progress={p2Progress}
          checkpoint={result.p2.lastCheckpoint}
          totalSegments={totalSegments}
          isWinner={result.winner === 'p2'}
          isJump={isJump}
        />
      </div>

      <div className="result-actions">
        <button className="neon-btn large" onClick={handlePlayAgain}>
          ▶ 再来一局
        </button>
        <button className="neon-btn purple" onClick={() => navigate('/lobby')}>
          ← 返回大厅
        </button>
      </div>
    </div>
  );
};

interface PlayerResultCardProps {
  side: 'p1' | 'p2';
  label: string;
  name: string;
  time: number | null;
  finished: boolean;
  progress: number;
  checkpoint: number;
  totalSegments: number;
  isWinner: boolean;
  isJump: boolean;
}

const PlayerResultCard: React.FC<PlayerResultCardProps> = ({
  side,
  label,
  name,
  time,
  finished,
  progress,
  checkpoint,
  totalSegments,
  isWinner,
  isJump,
}) => {
  const colorVar = side === 'p1' ? 'var(--p1-color)' : 'var(--p2-color)';
  return (
    <div className={`result-card ${isWinner ? 'is-winner' : ''}`} style={{ borderColor: colorVar }}>
      <div className="result-card-header" style={{ color: colorVar }}>
        <span className="result-side">{label}</span>
        {isWinner && <span className="result-crown">👑</span>}
      </div>

      <div className="result-name" style={{ color: colorVar }}>{name}</div>

      {isJump ? (
        <div className="result-time">
          <span className="time-val" style={{ color: colorVar }}>
            {checkpoint}
          </span>
          <span className="time-unit">/ {totalSegments}</span>
        </div>
      ) : (
        <div className="result-time">
          <span className="time-val" style={{ color: colorVar }}>
            {time != null ? (time / 1000).toFixed(2) : '--'}
          </span>
          <span className="time-unit">s</span>
        </div>
      )}

      <div className="result-bar">
        <div
          className="result-bar-fill"
          style={{
            width: `${progress}%`,
            background: colorVar,
            boxShadow: `0 0 12px ${colorVar}`,
          }}
        />
      </div>

      <div className="result-stats-row">
        <ResultStat label={isJump ? '终点' : '终点'} value={finished ? '✓' : '×'} color={finished ? 'green' : 'red'} />
        <ResultStat label={isJump ? '已跳' : '进度'} value={isJump ? `${checkpoint} 格` : `${progress}%`} color="green" />
      </div>
    </div>
  );
};

const ResultStat: React.FC<{ label: string; value: number | string; color: 'green' | 'red' }> = ({
  label,
  value,
  color,
}) => (
  <div className={`result-stat result-stat-${color}`}>
    <div className="result-stat-label">{label}</div>
    <div className="result-stat-value">{value}</div>
  </div>
);

export default ResultPage;
