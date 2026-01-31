FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY index.js ./

# 创建配置文件目录
RUN mkdir -p /app/config

# 环境变量
ENV TZ=Asia/Shanghai

# 运行应用
CMD ["node", "index.js"]
