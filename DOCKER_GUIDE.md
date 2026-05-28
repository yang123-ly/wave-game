# Docker 一键启动指南

本项目已 Docker 化，无需手动安装 MySQL、Java、Node.js，只需一条命令即可启动 **MySQL + 后端 + 前端**。

---

## 📋 环境要求

| 组件 | 版本 |
| :--- | :--- |
| Docker | 20.10+ |
| Docker Compose | 2.0+（Docker Desktop 已自带） |

---

## 🚀 快速启动

### 1. 启动所有服务

在项目根目录执行：

```bash
docker compose up -d --build
```

- `-d`：后台运行
- `--build`：首次启动或代码改动后重新构建镜像

首次启动需下载镜像 + 编译，约 **3-8 分钟**（视网速）。

### 2. 查看启动状态

```bash
docker compose ps
```

正常输出：

```
NAME                  STATUS              PORTS
duo-dash-mysql        Up (healthy)        0.0.0.0:3306->3306/tcp
duo-dash-backend      Up                  0.0.0.0:8080->8080/tcp
duo-dash-frontend     Up                  0.0.0.0:3000->80/tcp
```

### 3. 访问服务

| 服务 | 地址 |
| :--- | :--- |
| 🎮 **前端游戏页** | http://localhost:3000 |
| 🔧 后端 API | http://localhost:8080/api |
| 🗄️ MySQL | `localhost:3306` |

---

## 🗄️ MySQL 连接信息（Navicat / DBeaver）

| 字段 | 值 |
| :--- | :--- |
| 主机 | `127.0.0.1` |
| 端口 | `3306` |
| 用户名 | `root` |
| 密码 | `DuoDash@2024` |
| 数据库 | `duo_dash` |

> 容器启动时会自动创建 `duo_dash` 数据库，**后端启动时 Flyway 自动建表**。

---

## 📊 数据库表清单

启动后自动生成的表：

| 表名 | 用途 |
| :--- | :--- |
| `user` | 用户账号 |
| `user_badge` | 用户勋章 |
| `game_room` | 游戏房间 |
| `game_session` | 对战记录 |
| `task_config` | 任务库配置（已预置 7 种任务） |
| `task_sequence` | 任务序列 |
| `leaderboard` | 排行榜 |
| `operation_log` | 操作日志 |

---

## 🛠️ 常用命令

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 单独看后端
docker compose logs -f backend

# 单独看 MySQL
docker compose logs -f mysql
```

### 停止服务

```bash
# 停止但保留容器（数据保留）
docker compose stop

# 停止并删除容器（数据保留在 volume）
docker compose down

# ⚠️ 停止并删除容器 + 数据库数据（彻底清空）
docker compose down -v
```

### 重启某个服务

```bash
docker compose restart backend
```

### 重新构建某个服务

修改了后端代码：

```bash
docker compose up -d --build backend
```

修改了前端代码：

```bash
docker compose up -d --build frontend
```

### 进入容器调试

```bash
# 进入后端容器
docker exec -it duo-dash-backend sh

# 进入 MySQL 命令行
docker exec -it duo-dash-mysql mysql -uroot -pDuoDash@2024 duo_dash
```

---

## 🔍 故障排查

### Q1: 端口被占用

```
Error: port is already allocated
```

**原因**：3306 / 8080 / 3000 已被其他程序占用。

**解决**：
```bash
# 找出占用端口的进程
lsof -i :3306

# 杀掉占用进程，或修改 docker-compose.yml 中的端口映射，比如：
#   ports: ["3307:3306"]
```

### Q2: 后端启动失败，提示无法连接 MySQL

**原因**：MySQL 还没准备好后端就启动了。

**解决**：`docker-compose.yml` 已配置 `depends_on.condition: service_healthy`，会等 MySQL 健康检查通过后再启动后端。如果仍失败：

```bash
# 重启后端
docker compose restart backend

# 查看日志确认
docker compose logs -f backend
```

### Q3: Flyway 校验失败

修改了 `V1__init_schema.sql`，需要清空数据库重启：

```bash
docker compose down -v
docker compose up -d --build
```

### Q4: 前端访问到旧版本

浏览器缓存问题，强制刷新：`Cmd + Shift + R`。

或者重建前端：

```bash
docker compose up -d --build frontend
```

---

## 🏗️ 架构说明

```
┌─────────────────────────────────────────────────┐
│              duo-dash-network                    │
│                                                  │
│  ┌──────────┐    ┌─────────┐    ┌────────────┐  │
│  │ Frontend │───>│ Backend │───>│   MySQL    │  │
│  │  Nginx   │    │ Spring  │    │   8.0      │  │
│  │  :80     │    │  :8080  │    │   :3306    │  │
│  └──────────┘    └─────────┘    └────────────┘  │
│      ↑                                ↓          │
│      │                          mysql-data       │
│   :3000                         (volume)         │
└──────┼───────────────────────────────────────────┘
       │
   浏览器访问
```

- 前端 Nginx 自动反向代理 `/api/*` 到后端
- 后端通过内部 DNS `mysql:3306` 访问数据库
- MySQL 数据持久化在 Docker volume `mysql-data`，删除容器不丢数据

---

## 📦 各服务镜像

| 服务 | 基础镜像 | 说明 |
| :--- | :--- | :--- |
| mysql | `mysql:8.0` | 官方镜像，utf8mb4 编码 |
| backend | `maven:3.9-eclipse-temurin-17` → `eclipse-temurin:17-jre` | 多阶段构建，最终镜像约 250MB |
| frontend | `node:20-alpine` → `nginx:alpine` | 多阶段构建，最终镜像约 50MB |

---

## 🔧 修改配置

### 修改数据库密码

编辑 `docker-compose.yml`：

```yaml
services:
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: 你的新密码      # ← 改这里
  backend:
    environment:
      SPRING_DATASOURCE_PASSWORD: 你的新密码  # ← 同步改这里
```

修改后重启：

```bash
docker compose down -v   # 注意：会清空已有数据
docker compose up -d --build
```

### 修改端口映射

编辑 `docker-compose.yml` 中的 `ports`，如：

```yaml
ports:
  - "13306:3306"   # 宿主机 13306 -> 容器 3306
```

---

## ✅ 验证清单

启动后请检查：

- [ ] `docker compose ps` 三个服务都是 `Up`，mysql 显示 `(healthy)`
- [ ] 访问 http://localhost:3000 能看到首页
- [ ] 注册账号成功
- [ ] 登录后能进入大厅
- [ ] Navicat 用上述账号能连上 MySQL，看到 `duo_dash` 库下的 8 张表
