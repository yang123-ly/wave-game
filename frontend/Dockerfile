# ============== 构建阶段 ==============
FROM node:20-alpine AS builder

WORKDIR /build

# 利用层缓存：先复制 package.json
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制源码并构建
COPY . .
RUN npm run build

# ============== 运行阶段 ==============
FROM nginx:alpine

# 替换默认 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝构建产物
COPY --from=builder /build/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
