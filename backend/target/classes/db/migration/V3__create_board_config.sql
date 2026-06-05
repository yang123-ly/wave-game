-- 棋盘配置表：存储浪尖踏歌的赛道参数、格子事件、骰子事件
CREATE TABLE IF NOT EXISTS `board_config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    `name` VARCHAR(100) NOT NULL COMMENT '配置名称',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '配置描述',
    `total_platforms` INT NOT NULL DEFAULT 20 COMMENT '赛道总格数',
    `platform_spacing_z` DOUBLE NOT NULL DEFAULT 12.0 COMMENT '格子Z方向间距',
    `zigzag_amplitude` DOUBLE NOT NULL DEFAULT 16.0 COMMENT '之字形X方向幅度',
    `zigzag_period` INT NOT NULL DEFAULT 3 COMMENT '之字形周期',
    `platform_events` JSON NOT NULL COMMENT '格子事件列表 [{icon, text}]',
    `dice_events` JSON NOT NULL COMMENT '骰子事件列表 [{face, name, icon, detail}]',
    `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否为默认配置',
    `created_by` BIGINT DEFAULT NULL COMMENT '创建者ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_is_default` (`is_default`),
    KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='棋盘配置表';

-- 插入默认配置
INSERT INTO `board_config` (`name`, `description`, `total_platforms`, `platform_spacing_z`, `zigzag_amplitude`, `zigzag_period`, `platform_events`, `dice_events`, `is_default`) VALUES
('默认海盗棋盘', '浪尖踏歌默认棋盘配置', 20, 12.0, 16.0, 3,
 '[{"icon":"🏖️","text":"起点：踏上征途，扬帆起航！"},{"icon":"🐚","text":"发现一枚美丽的贝壳"},{"icon":"🌅","text":"朝霞映海，心旷神怡"},{"icon":"🐠","text":"热带鱼群在脚下游过"},{"icon":"🦀","text":"小螃蟹在岩石上晒太阳"},{"icon":"🪸","text":"珊瑚礁散发着七彩光芒"},{"icon":"🐙","text":"章鱼先生向你打招呼"},{"icon":"🌊","text":"一阵大浪袭来，站稳了！"},{"icon":"🐋","text":"远处鲸鱼跃出水面"},{"icon":"🦑","text":"深海巨鱿鱼路过此地"},{"icon":"⚓","text":"古老沉船遗迹浮现"},{"icon":"🧜","text":"人鱼歌声悠扬动听"},{"icon":"🪼","text":"水母群翩翩起舞"},{"icon":"🌈","text":"雨后彩虹横跨海面"},{"icon":"🐢","text":"海龟妈妈带着宝宝游过"},{"icon":"💎","text":"阳光折射出海底宝石的光"},{"icon":"🦈","text":"鲨鱼巡逻，但它只吃鱼"},{"icon":"🏝️","text":"远处小岛若隐若现"},{"icon":"🌟","text":"海面星光闪烁如梦似幻"},{"icon":"🏁","text":"终点：征服大海，胜利到达！"}]',
 '[{"face":1,"name":"微波轻拂","icon":"🌊","detail":"前进 1 格"},{"face":2,"name":"浪花翻涌","icon":"🌊","detail":"前进 2 格"},{"face":3,"name":"海风助力","icon":"🏄","detail":"前进 3 格"},{"face":4,"name":"潮汐奔涌","icon":"🐬","detail":"前进 4 格"},{"face":5,"name":"巨浪推送","icon":"🦈","detail":"前进 5 格"},{"face":6,"name":"海神眷顾","icon":"🔱","detail":"前进 6 格"}]',
 1);
