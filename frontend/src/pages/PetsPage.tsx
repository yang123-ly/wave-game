import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { petApi, extractErrorMessage } from '../services/petApi';
import type { Pet } from '../services/petApi';
import PetCard from '../components/PetCard';
import PetCreateModal from '../components/PetCreateModal';
import { MAX_PETS_PER_USER } from '../components/petConfig';
import './PetsPage.css';

/**
 * 当前后端能力（按 PetController.java 实际暴露）：
 * - ✅ GET    /api/pets        列表
 * - ⏳ POST   /api/pets        待补 Controller
 * - ⏳ PATCH  /api/pets/{id}   待补 Controller
 * - ⏳ DELETE /api/pets/{id}   待补 Service + Controller
 * - ⏳ POST   /api/pets/{id}/exp  待补 Service + Controller
 */
const BACKEND_FEATURES = {
  create: true,
  rename: true,
  delete: true,
  train: true,
};

const PetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchPets = useCallback(async () => {
    try {
      setErr('');
      const data = await petApi.list();
      setPets(data);
    } catch (e: any) {
      setErr(extractErrorMessage(e, '加载宠物列表失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleRename = async (id: number, name: string) => {
    try {
      await petApi.rename(id, { name });
      setActionMsg('改名成功');
      fetchPets();
    } catch (e: any) {
      setErr(extractErrorMessage(e, '改名失败'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await petApi.remove(id);
      setActionMsg('已放生');
      fetchPets();
    } catch (e: any) {
      setErr(extractErrorMessage(e, '删除失败'));
    }
  };

  const handleTrain = async (id: number) => {
    try {
      await petApi.addExp(id, { delta: 20 });
      setActionMsg('训练 +20 EXP');
      fetchPets();
    } catch (e: any) {
      setErr(extractErrorMessage(e, '训练失败'));
    }
  };

  /* msg 自动消失 */
  useEffect(() => {
    if (!actionMsg) return;
    const t = setTimeout(() => setActionMsg(''), 2000);
    return () => clearTimeout(t);
  }, [actionMsg]);

  const canAdd =
    BACKEND_FEATURES.create && pets.length < MAX_PETS_PER_USER;

  return (
    <div className="pets-page">
      <div className="cosmic-bg" />

      <header className="pets-header">
        <button className="neon-btn purple" onClick={() => navigate('/lobby')}>
          ← 返回大厅
        </button>
        <h1 className="pets-title">
          🐾 我的宠物
          <span className="pets-count">
            {pets.length} / {MAX_PETS_PER_USER}
          </span>
        </h1>
        <button
          className="neon-btn"
          onClick={() => setCreating(true)}
          disabled={!canAdd}
          title={
            BACKEND_FEATURES.create
              ? pets.length >= MAX_PETS_PER_USER
                ? '已达上限'
                : '收养新宠物'
              : '后端 POST /api/pets 尚未实现'
          }
        >
          + 收养
        </button>
      </header>

      {/* 后端能力提示 */}
      {!BACKEND_FEATURES.create && (
        <div className="pets-banner">
          ℹ️ 当前仅支持 <code>GET /api/pets</code>，其他操作（创建/改名/训练/删除）
          请等后端 PetController 补全相应接口后自动启用
        </div>
      )}

      {err && <div className="pets-err">{err}</div>}
      {actionMsg && <div className="pets-toast">{actionMsg}</div>}

      <main className="pets-main">
        {loading ? (
          <div className="pets-loading">加载中...</div>
        ) : pets.length === 0 ? (
          <div className="pets-empty">
            <div className="empty-emoji">🐣</div>
            <div className="empty-text">还没有宠物</div>
            <div className="empty-sub">
              {BACKEND_FEATURES.create
                ? '点击右上角「收养」开始你的宠物之旅'
                : '后端创建接口就绪后即可收养'}
            </div>
          </div>
        ) : (
          <div className="pets-grid">
            {pets.map((p) => (
              <PetCard
                key={p.id}
                pet={p}
                canRename={BACKEND_FEATURES.rename}
                canDelete={BACKEND_FEATURES.delete}
                canTrain={BACKEND_FEATURES.train}
                onRename={(n) => handleRename(p.id, n)}
                onDelete={() => handleDelete(p.id)}
                onTrain={() => handleTrain(p.id)}
              />
            ))}
          </div>
        )}
      </main>

      {creating && (
        <PetCreateModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setActionMsg('收养成功');
            fetchPets();
          }}
        />
      )}
    </div>
  );
};

export default PetsPage;
