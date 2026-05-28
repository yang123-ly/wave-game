# 数据库初始化指南

本文档说明如何为「双人对决·极速任务王」项目准备 MySQL 数据库环境。

---

## 1. 环境要求

| 组件 | 推荐版本 |
| :--- | :--- |
| MySQL | 8.0+ （兼容 5.7） |
| 字符集 | `utf8mb4` |
| 排序规则 | `utf8mb4_unicode_ci` |

---

## 2. 安装 MySQL

### macOS（推荐 Homebrew）

```bash
brew install mysql@8.0
brew services start mysql@8.0
```

首次启动后修改 root 密码：

```bash
mysql_secure_installation
```

### Docker（推荐快速试用）

```bash
docker run -d \
  --name duo-dash-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=duo_dash \
  -e MYSQL_CHARSET=utf8mb4 \
  -e MYSQL_COLLATION=utf8mb4_unicode_ci \
  -p 3306:3306 \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci
```

---

## 3. 创建数据库

使用 MySQL 客户端登录：

```bash
mysql -u root -p
```

执行以下 SQL：

```sql
CREATE DATABASE IF NOT EXISTS `duo_dash`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 可选：为应用创建单独账号
CREATE USER IF NOT EXISTS 'duodash'@'%' IDENTIFIED BY 'duodash123';
GRANT ALL PRIVILEGES ON `duo_dash`.* TO 'duodash'@'%';
FLUSH PRIVILEGES;
```

---

## 4. 配置后端连接

编辑 `backend/src/main/resources/application.yml` 中的 `spring.datasource` 配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/duo_dash?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: root      # 或改成 duodash
    password: root      # 或改成 duodash123
```

---

## 5. 表结构自动初始化（Flyway）

项目集成了 **Flyway**，启动后端时会自动执行 `backend/src/main/resources/db/migration/` 下的 SQL 脚本。

### 当前包含的迁移脚本

| 文件 | 说明 |
| :--- | :--- |
| `V1__init_schema.sql` | 初始化所有业务表结构 + 默认任务库种子数据 |

### 数据库表清单

| 表名 | 用途 |
| :--- | :--- |
| `user` | 用户账号、统计、等级 |
| `user_badge` | 用户勋章 |
| `game_room` | 游戏房间（本地/在线/好友） |
| `game_session` | 单局对战记录 |
| `task_config` | 任务库配置（点击/滑动/长按/颜色/摇动/平衡/记忆） |
| `task_sequence` | 任务序列（每局生成的任务列表快照） |
| `leaderboard` | 排行榜缓存 |
| `operation_log` | 操作日志 |

### 默认任务库种子数据

初始化脚本会自动写入 **7 种任务类型**：

| 任务类型 | 名称 | 难度 | 权重 |
| :--- | :--- | :--- | :--- |
| `TAP` | 疯狂点按 | 1 | 100 |
| `SWIPE` | 一刀两断 | 1 | 100 |
| `HOLD` | 能量蓄力 | 1 | 100 |
| `COLOR` | 颜色匹配 | 2 | 100 |
| `SHAKE` | Shake It | 2 | 80 |
| `BALANCE` | 保持水平 | 3 | 80 |
| `MEMORY` | 瞬间记忆 | 2 | 90 |

---

## 6. 验证

启动后端：

```bash
cd backend
mvn spring-boot:run
```

启动日志出现以下内容即成功：

```
o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://... (MySQL 8.x)
o.f.core.internal.command.DbValidate     : Successfully validated 1 migration
o.f.core.internal.command.DbMigrate      : Schema `duo_dash` is up to date. No migration necessary.
o.s.b.w.e.tomcat.TomcatWebServer         : Tomcat started on port 8080
```

登录 MySQL 验证：

```sql
USE duo_dash;
SHOW TABLES;
SELECT task_type, task_name FROM task_config;
```

---

## 7. 常见问题

### Q1: `Access denied for user 'root'@'localhost'`
检查 MySQL 用户密码是否与 `application.yml` 一致。

### Q2: `Public Key Retrieval is not allowed`
URL 已包含 `allowPublicKeyRetrieval=true`，确认未被修改。

### Q3: `Flyway validate failed`
开发期若改动了 `V1__init_schema.sql`，请清空数据库重新启动：

```sql
DROP DATABASE duo_dash;
CREATE DATABASE duo_dash DEFAULT CHARACTER SET utf8mb4;
```

### Q4: 想用图形化客户端
推荐：**DBeaver**、**Navicat**、**TablePlus**、**MySQL Workbench**。

---

## 8. 重置数据库（开发期）

```sql
DROP DATABASE IF EXISTS duo_dash;
CREATE DATABASE duo_dash DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

重启后端，Flyway 会自动重新建表并写入种子数据。
