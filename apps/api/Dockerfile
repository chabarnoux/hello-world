FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY ../../package.json ../../package-lock.json* /app/mono/
RUN npm set fund false && npm set audit false
RUN cd /app/mono && npm install --omit=dev

FROM base as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
EXPOSE 4000
CMD ["node", "dist/index.js"]