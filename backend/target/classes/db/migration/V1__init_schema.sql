-- 双人对决·极速任务王 - 数据库初始化脚本
-- 版本: V1.0
-- 创建时间: 2023-10-27

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
    `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `total_wins` INT DEFAULT 0 COMMENT '总胜场',
    `total_losses` INT DEFAULT 0 COMMENT '总负场',
    `best_time` INT DEFAULT NULL COMMENT '最快通关时间（毫秒）',
    `level` INT DEFAULT 1 COMMENT '用户等级',
    `experience` BIGINT DEFAULT 0 COMMENT '经验值',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`),
    UNIQUE KEY `uk_phone` (`phone`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 用户勋章表
CREATE TABLE IF NOT EXISTS `user_badge` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `badge_type` VARCHAR(50) NOT NULL COMMENT '勋章类型',
    `badge_name` VARCHAR(100) NOT NULL COMMENT '勋章名称',
    `badge_icon` VARCHAR(500) DEFAULT NULL COMMENT '勋章图标',
    `obtained_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_badge_type` (`badge_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户勋章表';

-- 游戏房间表
CREATE TABLE IF NOT EXISTS `game_room` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '房间ID',
    `room_code` VARCHAR(20) NOT NULL COMMENT '房间码',
    `host_id` BIGINT NOT NULL COMMENT '房主ID',
    `player1_id` BIGINT DEFAULT NULL COMMENT '玩家1 ID',
    `player2_id` BIGINT DEFAULT NULL COMMENT '玩家2 ID',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-等待中, 1-进行中, 2-已结束, 3-已取消',
    `mode` TINYINT NOT NULL DEFAULT 1 COMMENT '模式: 1-本地对战, 2-在线匹配, 3-好友房间',
    `theme` VARCHAR(50) DEFAULT 'default' COMMENT '主题',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `started_at` DATETIME DEFAULT NULL COMMENT '开始时间',
    `ended_at` DATETIME DEFAULT NULL COMMENT '结束时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_room_code` (`room_code`),
    KEY `idx_host_id` (`host_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏房间表';

-- 游戏对局表
CREATE TABLE IF NOT EXISTS `game_session` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '对局ID',
    `room_id` BIGINT NOT NULL COMMENT '房间ID',
    `player1_id` BIGINT NOT NULL COMMENT '玩家1 ID',
    `player2_id` BIGINT NOT NULL COMMENT '玩家2 ID',
    `winner_id` BIGINT DEFAULT NULL COMMENT '获胜者ID',
    `mode` TINYINT NOT NULL DEFAULT 1 COMMENT '模式: 1-本地对战, 2-在线匹配, 3-好友房间',
    `task_sequence_id` VARCHAR(50) DEFAULT NULL COMMENT '任务序列ID',
    `player1_time` INT DEFAULT NULL COMMENT '玩家1 总耗时（毫秒）',
    `player2_time` INT DEFAULT NULL COMMENT '玩家2 总耗时（毫秒）',
    `player1_errors` INT DEFAULT 0 COMMENT '玩家1 错误次数',
    `player2_errors` INT DEFAULT 0 COMMENT '玩家2 错误次数',
    `player1_perfect` TINYINT DEFAULT 0 COMMENT '玩家1 是否零失误',
    `player2_perfect` TINYINT DEFAULT 0 COMMENT '玩家2 是否零失误',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-进行中, 1-已结束',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `started_at` DATETIME DEFAULT NULL COMMENT '开始时间',
    `ended_at` DATETIME DEFAULT NULL COMMENT '结束时间',
    PRIMARY KEY (`id`),
    KEY `idx_room_id` (`room_id`),
    KEY `idx_player1_id` (`player1_id`),
    KEY `idx_player2_id` (`player2_id`),
    KEY `idx_winner_id` (`winner_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏对局表';

-- 任务配置表
CREATE TABLE IF NOT EXISTS `task_config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
    `task_type` VARCHAR(50) NOT NULL COMMENT '任务类型',
    `task_name` VARCHAR(100) NOT NULL COMMENT '任务名称',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '任务描述',
    `icon` VARCHAR(500) DEFAULT NULL COMMENT '任务图标',
    `weight` INT DEFAULT 100 COMMENT '出现权重',
    `difficulty` TINYINT DEFAULT 1 COMMENT '难度: 1-简单, 2-中等, 3-困难',
    `config_json` JSON DEFAULT NULL COMMENT '任务配置参数',
    `enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_task_type` (`task_type`),
    KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务配置表';

-- 任务序列表
CREATE TABLE IF NOT EXISTS `task_sequence` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '序列ID',
    `sequence_id` VARCHAR(50) NOT NULL COMMENT '序列标识',
    `task_ids` JSON NOT NULL COMMENT '任务ID列表',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_sequence_id` (`sequence_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务序列表';

-- 排行榜表
CREATE TABLE IF NOT EXISTS `leaderboard` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `wins` INT NOT NULL DEFAULT 0 COMMENT '胜场',
    `win_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT '胜率',
    `best_time` INT DEFAULT NULL COMMENT '最快时间',
    `rank` INT DEFAULT NULL COMMENT '排名',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    KEY `idx_rank` (`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排行榜表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS `operation_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id` BIGINT DEFAULT NULL COMMENT '用户ID',
    `operation` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `module` VARCHAR(50) NOT NULL COMMENT '模块',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
    `request_data` JSON DEFAULT NULL COMMENT '请求数据',
    `response_data` JSON DEFAULT NULL COMMENT '响应数据',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_operation` (`operation`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 初始化默认任务配置
INSERT INTO `task_config` (`task_type`, `task_name`, `description`, `weight`, `difficulty`, `config_json`, `enabled`, `sort_order`) VALUES
('TAP', '疯狂点按', '快速点击屏幕中央按钮', 100, 1, '{"targetCount": 10, "timeout": 5000}', 1, 1),
('SWIPE', '一刀两断', '按照箭头方向快速滑动屏幕', 100, 1, '{"direction": "right", "minDistance": 100, "timeout": 3000}', 1, 2),
('HOLD', '能量蓄力', '长按直到进度条满格松开', 100, 1, '{"holdTime": 2000, "tolerance": 200, "timeout": 5000}', 1, 3),
('COLOR', '颜色匹配', '屏幕变色时，点击对应颜色按钮', 100, 2, '{"colors": ["red", "green", "blue", "yellow"], "timeout": 2000}', 1, 4),
('SHAKE', 'Shake It', '剧烈摇晃手机达到指定数值', 80, 2, '{"shakeCount": 5, "threshold": 15, "timeout": 10000}', 1, 5),
('BALANCE', '保持水平', '倾斜手机使小球保持在中心圈内', 80, 3, '{"holdTime": 3000, "tolerance": 10}', 1, 6),
('MEMORY', '瞬间记忆', '显示3个图案后消失，按顺序点击', 90, 2, '{"patternCount": 3, "displayTime": 2000, "timeout": 5000}', 1, 7);
