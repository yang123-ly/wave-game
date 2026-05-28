import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';
import './LeaderboardPage.css';

interface LeaderboardPlayer {
  id: number;
  username: string;
  nickname?: string;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  bestTime?: number | null;
  level: number;
}

type SortType = 'wins' | 'winRate' | 'fastestTime';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [sortType, setSortType] = useState<SortType>('wins');
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    userApi
      .getLeaderboard(sortType)
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : [];
        setPlayers(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError('排行榜暂时无法加载');
        console.error('Leaderboard load error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sortType]);

  const sortOptions: Array<{ key: SortType; label: string }> = [
    { key: 'wins', label: '总胜场' },
    { key: 'winRate', label: '胜率榜' },
    { key: 'fastestTime', label: '极速榜' },
  ];

  return (
    <div className="leaderboard-page">
      <div className="cosmic-bg" />

      <header className="lb-header">
        <button className="lb-back" onClick={() => navigate('/lobby')}>
          ← 返回大厅
        </button>
        <div className="lb-title-wrap">
          <h1 className="lb-title">LEADERBOARD</h1>
          <p className="lb-subtitle">🏆 全球排行榜</p>
        </div>
        <div className="lb-spacer" />
      </header>

      <div className="lb-tabs">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            className={`lb-tab ${sortType === opt.key ? 'active' : ''}`}
            onClick={() => setSortType(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="lb-list">
        {loading && <div className="lb-empty">加载中...</div>}
        {!loading && error && <div className="lb-empty error">{error}</div>}
        {!loading && !error && players.length === 0 && (
          <div className="lb-empty">暂无玩家上榜</div>
        )}
        {!loading &&
          !error &&
          players.map((player, idx) => (
            <LeaderboardRow
              key={player.id}
              rank={idx + 1}
              player={player}
              sortType={sortType}
            />
          ))}
      </div>
    </div>
  );
};

interface RowProps {
  rank: number;
  player: LeaderboardPlayer;
  sortType: SortType;
}

const LeaderboardRow: React.FC<RowProps> = ({ rank, player, sortType }) => {
  const isTop3 = rank <= 3;
  const rankColors = ['#ffd60a', '#c0c0c0', '#cd7f32'];

  const renderMainStat = () => {
    if (sortType === 'wins') return `${player.totalWins}`;
    if (sortType === 'winRate') return `${Math.round(player.winRate)}%`;
    return player.bestTime != null ? `${(player.bestTime / 1000).toFixed(2)}s` : '--';
  };

  return (
    <div className={`lb-row ${isTop3 ? `lb-top top-${rank}` : ''}`}>
      <div className="lb-rank" style={isTop3 ? { color: rankColors[rank - 1] } : undefined}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </div>
      <div className="lb-avatar">
        {(player.nickname || player.username).charAt(0).toUpperCase()}
      </div>
      <div className="lb-info">
        <div className="lb-name">{player.nickname || player.username}</div>
        <div className="lb-meta">
          LV {player.level} · @{player.username}
        </div>
      </div>
      <div className="lb-stats">
        <div className="lb-stat-main">{renderMainStat()}</div>
        <div className="lb-stat-sub">
          {player.totalWins} 胜 · {player.totalLosses} 负
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
