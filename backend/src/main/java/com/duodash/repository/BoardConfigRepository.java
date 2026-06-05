package com.duodash.repository;

import com.duodash.entity.BoardConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 棋盘配置 Repository
 */
@Repository
public interface BoardConfigRepository extends JpaRepository<BoardConfig, Long> {

    /** 查找默认配置 */
    Optional<BoardConfig> findByIsDefaultTrue();

    /** 查找某用户创建的所有配置 */
    List<BoardConfig> findByCreatedByOrderByUpdatedAtDesc(Long userId);

    /** 查找系统模板（createdBy 为空的记录） */
    List<BoardConfig> findByCreatedByIsNullOrderByUpdatedAtDesc();

    /** 查找所有配置（按更新时间倒序） */
    List<BoardConfig> findAllByOrderByUpdatedAtDesc();
}
