# RideHub 後端 — Cloud Run 用映像
FROM node:20-alpine

ENV NODE_ENV=production
# Cloud Run 會自行注入 PORT（8080）；此處設預設值方便本機測試
ENV PORT=8080

WORKDIR /app

# 先裝依賴（善用 layer cache）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 複製原始碼與 API 文件
COPY src ./src
COPY openapi.yaml ./openapi.yaml

# 以非 root 執行
USER node

EXPOSE 8080
CMD ["node", "src/server.js"]
