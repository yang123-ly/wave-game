package com.duodash.repository;

import com.duodash.entity.TaskConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 任务配置数据访问接口
 * 
 * @author Duo Dash Team
 */
@Repository
public interface TaskConfigRepository extends JpaRepository<TaskConfig, Long> {

    /**
     * 根据任务类型查找配置
     */
    Optional<TaskConfig> findByTaskType(String taskType);

    /**
     * 查找所有启用的任务配置
     */
    @Query("SELECT t FROM TaskConfig t WHERE t.enabled = 1 ORDER BY t.sortOrder ASC")
    List<TaskConfig> findEnabledTasks();

    /**
     * 根据难度查找任务配置
     */
    @Query("SELECT t FROM TaskConfig t WHERE t.enabled = 1 AND t.difficulty = :difficulty ORDER BY t.sortOrder ASC")
    List<TaskConfig> findByDifficulty(@Param("difficulty") Integer difficulty);

    /**
     * 根据权重随机选择任务
     */
    @Query("SELECT t FROM TaskConfig t WHERE t.enabled = 1 ORDER BY RAND()")
    List<TaskConfig> findRandomTasks(int limit);

    /**
     * 统计启用的任务数量
     */
    long countByEnabled(Integer enabled);
}
