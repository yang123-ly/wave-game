# ============== 构建阶段 ==============
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# 先拷贝 pom.xml 利用 Docker 层缓存（依赖不变时跳过下载）
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# 拷贝源码并构建
COPY src ./src
RUN mvn clean package -DskipTests -B

# ============== 运行阶段 ==============
FROM eclipse-temurin:17-jre

WORKDIR /app

# 安装 curl 用于健康检查
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 复制构建产物
COPY --from=builder /build/target/*.jar app.jar

# 时区设置
ENV TZ=Asia/Shanghai

EXPOSE 8080

# JVM 参数优化（容器环境）
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1
