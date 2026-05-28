import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pet } from '../services/petApi';
import { speciesLabel, moodEmoji } from './petConfig';
import PetCanvas from '../components_pet/PetCanvas';

interface Props {
  pet: Pet;
  /** create/rename/delete/train 都依赖后端补全，未就绪时禁用按钮 */
  canRename?: boolean;
  canDelete?: boolean;
  canTrain?: boolean;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  onTrain?: () => void;
}

const PetCard: React.FC<Props> = ({
  pet,
  canRename = false,
  canDelete = false,
  canTrain = false,
  onRename,
  onDelete,
  onTrain,
}) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pet.name);

  const expPercent = Math.min(
    100,
    Math.round((pet.exp / Math.max(1, pet.expToNextLevel)) * 100),
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== pet.name && onRename) onRename(trimmed);
    setEditing(false);
  };

  return (
    <div className="pet-card glass-card">
      <div
        className="pet-3d-thumb"
        onClick={() => navigate(`/pets/${pet.id}`)}
        title="查看详情"
      >
        <PetCanvas
          species={pet.species}
          mood={pet.mood}
          level={pet.level}
          autoRotate
        />
        <div className="pet-3d-tip">点击查看 →</div>
      </div>

      {editing ? (
        <input
          className="pet-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setName(pet.name);
              setEditing(false);
            }
          }}
          autoFocus
          maxLength={16}
        />
      ) : (
        <div
          className={`pet-name ${canRename ? 'is-editable' : ''}`}
          onClick={() => canRename && setEditing(true)}
          title={canRename ? '点击改名' : pet.name}
        >
          {pet.name}
        </div>
      )}

      <div className="pet-species">{speciesLabel(pet.species)}</div>

      <div className="pet-level-row">
        <span className="pet-level">Lv.{pet.level}</span>
        <span className="pet-mood">
          {moodEmoji(pet.mood)} {pet.mood}
        </span>
      </div>

      <div className="pet-exp-bar">
        <div className="pet-exp-fill" style={{ width: `${expPercent}%` }} />
      </div>
      <div className="pet-exp-text">
        EXP {pet.exp} / {pet.expToNextLevel}
      </div>

      <div className="pet-actions">
        <button
          className="pet-btn pet-btn-train"
          onClick={onTrain}
          disabled={!canTrain}
          title={canTrain ? '训练 +20 经验' : '后端尚未实现'}
        >
          🎮 训练
        </button>
        <button
          className="pet-btn pet-btn-delete"
          onClick={() => {
            if (window.confirm(`确定放生 ${pet.name}？`)) onDelete?.();
          }}
          disabled={!canDelete}
          title={canDelete ? '放生' : '后端尚未实现'}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default PetCard;
