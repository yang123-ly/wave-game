import React, { useState } from 'react';
import { petApi, extractErrorMessage } from '../services/petApi';
import type { Pet, PetSpecies } from '../services/petApi';
import { SPECIES_OPTIONS } from './petConfig';
import PetCanvas from '../components_pet/PetCanvas';

interface Props {
  onClose: () => void;
  onCreated: (pet: Pet) => void;
}

const PetCreateModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('cat');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErr('请填写名字');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const pet = await petApi.create({ name: name.trim(), species });
      onCreated(pet);
      onClose();
    } catch (e: any) {
      setErr(extractErrorMessage(e, '创建失败（后端可能尚未实现 POST /api/pets）'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pet-modal-mask" onClick={onClose}>
      <div className="pet-modal-body glass-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="pet-modal-title">🐾 收养新宠物</h2>

        <label className="pet-modal-label">名字</label>
        <input
          className="neon-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="给它起个名字..."
        />

        <label className="pet-modal-label">种类（点击预览）</label>
        <div className="pet-species-grid">
          {SPECIES_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`pet-species-btn ${species === o.id ? 'is-active' : ''}`}
              onClick={() => setSpecies(o.id)}
            >
              <div className="pet-species-3d">
                <PetCanvas species={o.id} mood={80} level={1} autoRotate />
              </div>
              <span className="pet-species-label">{o.label}</span>
            </button>
          ))}
        </div>

        {err && <div className="pet-modal-err">{err}</div>}

        <div className="pet-modal-actions">
          <button className="neon-btn purple" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button className="neon-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '收养中...' : '✓ 确认收养'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetCreateModal;
