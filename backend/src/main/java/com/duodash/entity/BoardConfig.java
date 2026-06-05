package com.duodash.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 棋盘配置实体
 * 存储浪尖踏歌的赛道参数、格子事件、骰子事件
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "board_config")
@JsonIgnoreProperties(ignoreUnknown = true)
public class BoardConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "total_platforms", nullable = false)
    private Integer totalPlatforms = 20;

    @Column(name = "platform_spacing_z", nullable = false)
    private Double platformSpacingZ = 12.0;

    @Column(name = "zigzag_amplitude", nullable = false)
    private Double zigzagAmplitude = 16.0;

    @Column(name = "zigzag_period", nullable = false)
    private Integer zigzagPeriod = 3;

    /** 格子事件 JSON: [{icon, text}] */
    @Column(name = "platform_events", nullable = false, columnDefinition = "JSON")
    private String platformEvents;

    /** 骰子事件 JSON: [{face, name, icon, detail}] */
    @Column(name = "dice_events", nullable = false, columnDefinition = "JSON")
    private String diceEvents;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "created_by")
    private Long createdBy;

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
