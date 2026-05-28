/**
 * 宠物详情页：大画布 + OrbitControls 可旋转 + 训练动画 + 升级特效
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { petApi, extractErrorMessage } from '../services/petApi';
import type { Pet } from '../services/petApi';
import { speciesLabel, moodEmoji } from '../components/petConfig';
import PetCanvas from '../components_pet/PetCanvas';
import './PetDetailPage.css';

const PetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [excited, setExcited] = useState(false);
  const [training, setTraining] = useState(false);
  const [levelUp, setLevelUp] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setErr('');
      const list = await petApi.list();
      const found = list.find((p) => String(p.id) === id);
      if (!found) {
        setErr('宠物不存在或已被放生');
      } else {
        setPet(found);
      }
    } catch (e: any) {
      setErr(extractErrorMessage(e, '加载失败'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTrain = async () => {
    if (!pet || training) return;
    setTraining(true);
    setExcited(true);
    try {
      const oldLevel = pet.level;
      const updated = await petApi.addExp(pet.id, { delta: 30 });
      setPet(updated);
      if (updated.level > oldLevel) {
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 2200);
      }
    } catch (e: any) {
      setErr(extractErrorMessage(e, '训练失败'));
    } finally {
      // 兴奋动画再持续 1.2s
      setTimeout(() => {
        setExcited(false);
        setTraining(false);
      }, 1200);
    }
  };

  if (loading) {
    return (
      <div className="pet-detail-page">
        <div className="pets-loading">加载中...</div>
      </div>
    );
  }

  if (err || !pet) {
    return (
      <div className="pet-detail-page">
        <div className="pets-err">{err || '宠物不存在'}</div>
        <button className="neon-btn purple" onClick={() => navigate('/pets')}>
          ← 返回宠物列表
        </button>
      </div>
    );
  }

  const expPercent = Math.min(
    100,
    Math.round((pet.exp / Math.max(1, pet.expToNextLevel)) * 100),
  );

  return (
    <div className="pet-detail-page">
      <div className="cosmic-bg" />

      <header className="pet-detail-header">
        <button className="neon-btn purple" onClick={() => navigate('/pets')}>
          ← 返回列表
        </button>
        <h1 className="pet-detail-title">
          {pet.name}
          <span className="pet-detail-species">· {speciesLabel(pet.species)}</span>
        </h1>
      </header>

      <main className="pet-detail-main">
        {/* 左：3D 大画布 */}
        <section className="pet-detail-stage glass-card">
          <PetCanvas
            species={pet.species}
            mood={pet.mood}
            level={pet.level}
            excited={excited}
            interactive
          />
          <div className="pet-stage-hint">🖱️ 拖动旋转 / 滚轮缩放</div>
          {levelUp && (
            <div className="pet-levelup-burst">
              <span>✨ LEVEL UP ✨</span>
              <div className="burst-sub">Lv.{pet.level}</div>
            </div>
          )}
        </section>

        {/* 右：属性面板 */}
        <aside className="pet-detail-panel glass-card">
          <div className="panel-row">
            <span className="panel-label">等级</span>
            <span className="panel-value level">Lv.{pet.level}</span>
          </div>

          <div className="panel-row">
            <span className="panel-label">心情</span>
            <span className="panel-value">
              {moodEmoji(pet.mood)} {pet.mood}/100
            </span>
          </div>

          <div className="panel-block">
            <div className="panel-label">经验</div>
            <div className="panel-exp-bar">
              <div className="panel-exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
            <div className="panel-exp-text">
              {pet.exp} / {pet.expToNextLevel}
            </div>
          </div>

          <div className="panel-actions">
            <button
              className="neon-btn"
              onClick={handleTrain}
              disabled={training}
            >
              {training ? '训练中...' : '🎮 训练 +30 经验'}
            </button>
          </div>

          <div className="panel-tips">
            <p>💡 <b>训练</b>：每次 +30 经验，满 100×Lv 自动升级，心情 +10</p>
            <p>💡 <b>等级 ≥ 2</b>：头顶出现专属光环</p>
            <p>💡 <b>心情 &lt; 60</b>：外观变灰，多陪 ta 训练吧</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default PetDetailPage;
