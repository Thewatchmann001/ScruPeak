FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build 2>/dev/null || npx tsc 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=4005

EXPOSE 4005

CMD ["node", "dist/index.js"]
