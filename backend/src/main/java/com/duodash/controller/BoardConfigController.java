package com.duodash.controller;

import com.duodash.entity.BoardConfig;
import com.duodash.service.BoardConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 棋盘配置 REST API
 *
 * 接口列表：
 * GET    /board-configs              获取所有配置
 * GET    /board-configs/templates    获取系统模板列表
 * GET    /board-configs/my           获取当前用户的个性化配置
 * GET    /board-configs/default      获取默认配置
 * GET    /board-configs/{id}         根据ID获取配置
 * POST   /board-configs              创建新配置
 * POST   /board-configs/{id}/clone   从模板复制一份个性化配置
 * PUT    /board-configs/{id}         更新配置
 * DELETE /board-configs/{id}         删除配置
 * PUT    /board-configs/{id}/set-default  设为默认配置
 */
@RestController
@RequestMapping("/board-configs")
@RequiredArgsConstructor
public class BoardConfigController {

    private final BoardConfigService boardConfigService;

    /** 获取所有配置 */
    @GetMapping
    public ResponseEntity<List<BoardConfig>> listAll() {
        return ResponseEntity.ok(boardConfigService.listAll());
    }

    /** 获取系统模板列表 */
    @GetMapping("/templates")
    public ResponseEntity<List<BoardConfig>> listTemplates() {
        return ResponseEntity.ok(boardConfigService.listTemplates());
    }

    /** 获取当前用户的个性化配置 */
    @GetMapping("/my")
    public ResponseEntity<List<BoardConfig>> listMy(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(boardConfigService.listByUser(userId));
    }

    /** 获取默认配置 */
    @GetMapping("/default")
    public ResponseEntity<BoardConfig> getDefault() {
        return ResponseEntity.ok(boardConfigService.getDefault());
    }

    /** 根据ID获取配置 */
    @GetMapping("/{id}")
    public ResponseEntity<BoardConfig> getById(@PathVariable Long id) {
        return ResponseEntity.ok(boardConfigService.getById(id));
    }

    /** 创建新配置 */
    @PostMapping
    public ResponseEntity<BoardConfig> create(
            @RequestBody BoardConfig config,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId != null) {
            config.setCreatedBy(userId);
        }
        return ResponseEntity.ok(boardConfigService.create(config));
    }

    /** 从模板复制一份个性化配置 */
    @PostMapping("/{id}/clone")
    public ResponseEntity<BoardConfig> cloneFromTemplate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(boardConfigService.cloneFromTemplate(id, userId));
    }

    /** 更新配置 */
    @PutMapping("/{id}")
    public ResponseEntity<BoardConfig> update(
            @PathVariable Long id,
            @RequestBody BoardConfig updates) {
        return ResponseEntity.ok(boardConfigService.update(id, updates));
    }

    /** 删除配置 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        boardConfigService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** 设为默认配置 */
    @PutMapping("/{id}/set-default")
    public ResponseEntity<BoardConfig> setDefault(@PathVariable Long id) {
        return ResponseEntity.ok(boardConfigService.setDefault(id));
    }
}
