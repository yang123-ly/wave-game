package com.duodash.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 任务配置实体
 * 
 * @author Duo Dash Team
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "task_config")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TaskConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_type", nullable = false, unique = true, length = 50)
    private String taskType;

    @Column(name = "task_name", nullable = false, length = 100)
    private String taskName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "icon", length = 500)
    private String icon;

    @Column(name = "weight")
    private Integer weight = 100;

    @Column(name = "difficulty")
    private Integer difficulty = 1;

    @Column(name = "config_json", columnDefinition = "json")
    private String configJson;

    @Column(name = "enabled")
    private Integer enabled = 1;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
