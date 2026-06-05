package com.duodash.service;

import com.duodash.entity.BoardConfig;
import com.duodash.repository.BoardConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 棋盘配置 Service
 */
@Service
@RequiredArgsConstructor
public class BoardConfigService {

    private final BoardConfigRepository boardConfigRepository;

    /** 获取所有配置 */
    public List<BoardConfig> listAll() {
        return boardConfigRepository.findAllByOrderByUpdatedAtDesc();
    }

    /** 获取系统模板列表（createdBy 为空的记录） */
    public List<BoardConfig> listTemplates() {
        return boardConfigRepository.findByCreatedByIsNullOrderByUpdatedAtDesc();
    }

    /** 获取指定用户的个性化配置 */
    public List<BoardConfig> listByUser(Long userId) {
        return boardConfigRepository.findByCreatedByOrderByUpdatedAtDesc(userId);
    }

    /** 获取默认配置 */
    public BoardConfig getDefault() {
        return boardConfigRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new RuntimeException("未找到默认棋盘配置"));
    }

    /** 根据 ID 获取配置 */
    public BoardConfig getById(Long id) {
        return boardConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("棋盘配置不存在: " + id));
    }

    /** 创建新配置 */
    @Transactional
    public BoardConfig create(BoardConfig config) {
        config.setId(null);
        if (config.getIsDefault() == null) {
            config.setIsDefault(false);
        }
        return boardConfigRepository.save(config);
    }

    /** 更新配置 */
    @Transactional
    public BoardConfig update(Long id, BoardConfig updates) {
        BoardConfig existing = getById(id);
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getTotalPlatforms() != null) existing.setTotalPlatforms(updates.getTotalPlatforms());
        if (updates.getPlatformSpacingZ() != null) existing.setPlatformSpacingZ(updates.getPlatformSpacingZ());
        if (updates.getZigzagAmplitude() != null) existing.setZigzagAmplitude(updates.getZigzagAmplitude());
        if (updates.getZigzagPeriod() != null) existing.setZigzagPeriod(updates.getZigzagPeriod());
        if (updates.getPlatformEvents() != null) existing.setPlatformEvents(updates.getPlatformEvents());
        if (updates.getDiceEvents() != null) existing.setDiceEvents(updates.getDiceEvents());
        return boardConfigRepository.save(existing);
    }

    /** 删除配置（不允许删除默认配置） */
    @Transactional
    public void delete(Long id) {
        BoardConfig config = getById(id);
        if (Boolean.TRUE.equals(config.getIsDefault())) {
            throw new RuntimeException("不能删除默认配置");
        }
        boardConfigRepository.deleteById(id);
    }

    /** 设为默认配置 */
    @Transactional
    public BoardConfig setDefault(Long id) {
        // 取消旧的默认
        boardConfigRepository.findByIsDefaultTrue()
                .ifPresent(old -> {
                    old.setIsDefault(false);
                    boardConfigRepository.save(old);
                });
        // 设置新的默认
        BoardConfig config = getById(id);
        config.setIsDefault(true);
        return boardConfigRepository.save(config);
    }

    /** 从模板复制一份个性化配置给指定用户 */
    @Transactional
    public BoardConfig cloneFromTemplate(Long templateId, Long userId) {
        BoardConfig template = getById(templateId);
        BoardConfig clone = new BoardConfig();
        clone.setName(template.getName() + " (我的)");
        clone.setDescription("基于「" + template.getName() + "」创建的个性化配置");
        clone.setTotalPlatforms(template.getTotalPlatforms());
        clone.setPlatformSpacingZ(template.getPlatformSpacingZ());
        clone.setZigzagAmplitude(template.getZigzagAmplitude());
        clone.setZigzagPeriod(template.getZigzagPeriod());
        clone.setPlatformEvents(template.getPlatformEvents());
        clone.setDiceEvents(template.getDiceEvents());
        clone.setIsDefault(false);
        clone.setCreatedBy(userId);
        return boardConfigRepository.save(clone);
    }
}
