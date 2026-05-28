-- 为 pet 表补充 mood 字段
-- 历史 pet 表由开发期手工建表创建，缺少与 Pet 实体对齐的 mood 列
ALTER TABLE pet
    ADD COLUMN mood INT NOT NULL DEFAULT 80 COMMENT '心情值 0-100' AFTER avatar;
