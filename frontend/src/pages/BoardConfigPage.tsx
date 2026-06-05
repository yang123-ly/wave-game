/**
 * 棋盘配置中心 - /config（需登录）
 * 左侧：系统模板 + 我的配置列表
 * 右侧：配置编辑器（格子事件、骰子事件、赛道参数）
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useConfigStore,
  PlatformEventConfig,
  DiceEventConfig,
  ServerBoardConfig,
} from '../engine_wave/configStore';
import { extractErrorMessage } from '../services/api';
import './BoardConfigPage.css';

const BoardConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    serverId,
    configName,
    trackParams,
    platformEvents,
    diceEvents,
    loading,
    templates,
    myConfigs,
    setConfigName,
    setTrackParams,
    setPlatformEvent,
    addPlatformEvent,
    removePlatformEvent,
    setDiceEvent,
    resetToDefault,
    importConfig,
    exportConfig,
    saveToServer,
    fetchLists,
    loadConfigById,
    cloneTemplate,
    deleteConfig,
  } = useConfigStore();

  const [activeTab, setActiveTab] = useState<'track' | 'platforms' | 'dice'>('platforms');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  /** 页面加载时拉取模板和我的配置列表 */
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  /** 选择一个配置进入编辑 */
  const handleSelectConfig = useCallback(async (id: number) => {
    try {
      await loadConfigById(id);
      setEditing(true);
    } catch (err) {
      alert('❌ 加载配置失败：' + extractErrorMessage(err));
    }
  }, [loadConfigById]);

  /** 从模板复制 */
  const handleClone = useCallback(async (templateId: number) => {
    try {
      await cloneTemplate(templateId);
      setEditing(true);
      alert('✅ 已从模板创建你的个性化配置，可以自由编辑了！');
    } catch (err) {
      alert('❌ 复制失败：' + extractErrorMessage(err));
    }
  }, [cloneTemplate]);

  /** 删除配置 */
  const handleDelete = useCallback(async (id: number, name: string) => {
    if (!window.confirm(`确定删除「${name}」？此操作不可恢复。`)) return;
    try {
      await deleteConfig(id);
      if (serverId === id) setEditing(false);
      alert('✅ 已删除');
    } catch (err) {
      alert('❌ 删除失败：' + extractErrorMessage(err));
    }
  }, [deleteConfig, serverId]);

  /** 保存到后端 */
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToServer();
      alert('✅ 配置已保存');
    } catch (err) {
      alert('❌ 保存失败：' + extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /** 新建空白配置 */
  const handleCreateNew = () => {
    resetToDefault();
    useConfigStore.setState({ serverId: null, configName: '我的新配置' });
    setEditing(true);
  };

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${configName || 'board-config'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const config = JSON.parse(ev.target?.result as string);
          importConfig(config);
          alert('导入成功！别忘了点「💾 保存」同步到服务器。');
        } catch {
          alert('导入失败：JSON 格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="config-page">
      <header className="config-header">
        <div className="config-header-left">
          <button className="config-btn config-btn-back" onClick={() => navigate('/')}>← 返回</button>
          <h2>🗺️ 棋盘配置中心</h2>
        </div>
        {editing && (
          <div className="config-actions">
            <button className="config-btn config-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ 保存中...' : '💾 保存'}
            </button>
            <button className="config-btn" onClick={handleExport}>📤 导出</button>
            <button className="config-btn" onClick={handleImport}>📥 导入</button>
            <button className="config-btn" onClick={() => setEditing(false)}>✕ 关闭编辑</button>
          </div>
        )}
      </header>

      <div className="config-layout">
        {/* ===== 左侧：配置列表 ===== */}
        <aside className="config-sidebar">
          {/* 系统模板 */}
          <div className="config-list-section">
            <h3>📋 系统模板</h3>
            {templates.length === 0 && <p className="config-empty">暂无模板</p>}
            {templates.map((tpl) => (
              <ConfigCard
                key={tpl.id}
                config={tpl}
                isActive={editing && serverId === tpl.id}
                isTemplate
                onSelect={() => handleSelectConfig(tpl.id)}
                onClone={() => handleClone(tpl.id)}
              />
            ))}
          </div>

          {/* 我的配置 */}
          <div className="config-list-section">
            <div className="config-list-header">
              <h3>🎮 我的配置</h3>
              <button className="config-btn config-btn-small" onClick={handleCreateNew}>+ 新建</button>
            </div>
            {myConfigs.length === 0 && (
              <p className="config-empty">还没有个性化配置，从模板复制一份开始吧！</p>
            )}
            {myConfigs.map((cfg) => (
              <ConfigCard
                key={cfg.id}
                config={cfg}
                isActive={editing && serverId === cfg.id}
                onSelect={() => handleSelectConfig(cfg.id)}
                onDelete={() => handleDelete(cfg.id, cfg.name)}
              />
            ))}
          </div>
        </aside>

        {/* ===== 右侧：编辑区 ===== */}
        <main className="config-main">
          {!editing ? (
            <div className="config-placeholder">
              <div className="config-placeholder-icon">🗺️</div>
              <h3>选择或创建配置</h3>
              <p>从左侧选择一个系统模板查看，或者复制模板创建你的个性化棋盘配置。</p>
              <button className="config-btn config-btn-primary" onClick={handleCreateNew}>+ 新建空白配置</button>
            </div>
          ) : (
            <>
              {/* 配置名称 */}
              <div className="config-name-row">
                <input
                  className="config-name-input"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="配置名称"
                />
                {serverId && <span className="config-id-badge">ID: {serverId}</span>}
              </div>

              {/* Tab 切换 */}
              <div className="config-tabs">
                <button className={`config-tab ${activeTab === 'platforms' ? 'active' : ''}`} onClick={() => setActiveTab('platforms')}>
                  🏝️ 格子事件
                </button>
                <button className={`config-tab ${activeTab === 'dice' ? 'active' : ''}`} onClick={() => setActiveTab('dice')}>
                  🎲 骰子事件
                </button>
                <button className={`config-tab ${activeTab === 'track' ? 'active' : ''}`} onClick={() => setActiveTab('track')}>
                  ⚙️ 赛道参数
                </button>
              </div>

              {/* 内容区 */}
              <div className="config-content">
                {loading && <div className="config-loading">⏳ 加载中...</div>}
                {activeTab === 'track' && (
                  <TrackParamsEditor params={trackParams} onChange={setTrackParams} />
                )}
                {activeTab === 'platforms' && (
                  <PlatformEventsEditor
                    events={platformEvents}
                    onUpdate={setPlatformEvent}
                    onAdd={addPlatformEvent}
                    onRemove={removePlatformEvent}
                  />
                )}
                {activeTab === 'dice' && (
                  <DiceEventsEditor events={diceEvents} onUpdate={setDiceEvent} />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

/* ============ 配置卡片 ============ */
interface ConfigCardProps {
  config: ServerBoardConfig;
  isActive: boolean;
  isTemplate?: boolean;
  onSelect: () => void;
  onClone?: () => void;
  onDelete?: () => void;
}

const ConfigCard: React.FC<ConfigCardProps> = ({ config, isActive, isTemplate, onSelect, onClone, onDelete }) => {
  let platformCount = 0;
  try { platformCount = JSON.parse(config.platformEvents).length; } catch { /* ignore */ }

  return (
    <div className={`config-card ${isActive ? 'config-card-active' : ''}`} onClick={onSelect}>
      <div className="config-card-info">
        <div className="config-card-name">
          {config.isDefault && <span className="config-badge-default">默认</span>}
          {config.name}
        </div>
        <div className="config-card-meta">
          {platformCount} 格 · {config.totalPlatforms} 平台 · 更新于 {config.updatedAt?.slice(0, 10)}
        </div>
      </div>
      <div className="config-card-actions" onClick={(e) => e.stopPropagation()}>
        {isTemplate && onClone && (
          <button className="config-btn config-btn-small config-btn-clone" onClick={onClone} title="复制为我的配置">
            📋 复制
          </button>
        )}
        {!isTemplate && onDelete && (
          <button className="config-btn config-btn-small config-btn-danger" onClick={onDelete} title="删除">
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

/* ============ 赛道参数编辑器 ============ */
interface TrackParamsData {
  totalPlatforms: number;
  platformSpacingZ: number;
  zigzagAmplitude: number;
  zigzagPeriod: number;
}

const TrackParamsEditor: React.FC<{ params: TrackParamsData; onChange: (p: Partial<TrackParamsData>) => void }> = ({ params, onChange }) => (
  <div className="config-section">
    <h3>⚙️ 赛道参数</h3>
    <div className="config-grid">
      <label>
        <span>总格数</span>
        <input type="number" min={5} max={50} value={params.totalPlatforms}
          onChange={(e) => onChange({ totalPlatforms: +e.target.value })} />
      </label>
      <label>
        <span>格子间距 (Z)</span>
        <input type="number" min={4} max={30} step={1} value={params.platformSpacingZ}
          onChange={(e) => onChange({ platformSpacingZ: +e.target.value })} />
      </label>
      <label>
        <span>之字形幅度 (X)</span>
        <input type="number" min={4} max={40} step={1} value={params.zigzagAmplitude}
          onChange={(e) => onChange({ zigzagAmplitude: +e.target.value })} />
      </label>
      <label>
        <span>之字形周期</span>
        <input type="number" min={2} max={10} value={params.zigzagPeriod}
          onChange={(e) => onChange({ zigzagPeriod: +e.target.value })} />
      </label>
    </div>
    <p className="config-hint">💡 修改后请点击顶部「💾 保存」同步到服务器</p>
  </div>
);

/* ============ 格子事件编辑器 ============ */
const PlatformEventsEditor: React.FC<{
  events: PlatformEventConfig[];
  onUpdate: (index: number, event: PlatformEventConfig) => void;
  onAdd: (event: PlatformEventConfig) => void;
  onRemove: (index: number) => void;
}> = ({ events, onUpdate, onAdd, onRemove }) => (
  <div className="config-section">
    <h3>🏝️ 格子事件 ({events.length} 格)</h3>
    <div className="config-platform-list">
      {events.map((event, i) => (
        <div key={i} className="config-platform-item">
          <span className="config-platform-index">{i}</span>
          <input className="config-platform-icon" value={event.icon}
            onChange={(e) => onUpdate(i, { ...event, icon: e.target.value })} placeholder="图标" />
          <input className="config-platform-text" value={event.text}
            onChange={(e) => onUpdate(i, { ...event, text: e.target.value })} placeholder="事件文案" />
          <button className="config-platform-remove"
            onClick={() => { if (window.confirm(`删除第 ${i} 格？`)) onRemove(i); }} title="删除">✕</button>
        </div>
      ))}
    </div>
    <button className="config-btn config-btn-add" onClick={() => onAdd({ icon: '🌊', text: '新格子事件' })}>
      + 添加格子
    </button>
  </div>
);

/* ============ 骰子事件编辑器 ============ */
const DiceEventsEditor: React.FC<{
  events: DiceEventConfig[];
  onUpdate: (index: number, event: DiceEventConfig) => void;
}> = ({ events, onUpdate }) => (
  <div className="config-section">
    <h3>🎲 骰子事件 (6 面)</h3>
    <div className="config-dice-list">
      {events.map((event, i) => (
        <div key={i} className="config-dice-item">
          <span className="config-dice-face">🎲 {event.face}</span>
          <input className="config-dice-icon" value={event.icon}
            onChange={(e) => onUpdate(i, { ...event, icon: e.target.value })} placeholder="图标" />
          <input className="config-dice-name" value={event.name}
            onChange={(e) => onUpdate(i, { ...event, name: e.target.value })} placeholder="名称" />
          <input className="config-dice-detail" value={event.detail}
            onChange={(e) => onUpdate(i, { ...event, detail: e.target.value })} placeholder="描述" />
        </div>
      ))}
    </div>
  </div>
);

export default BoardConfigPage;
