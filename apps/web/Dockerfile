FROM node:20-alpine as deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY ../../package.json ../../package-lock.json* /app/mono/
RUN npm set fund false && npm set audit false
RUN cd /app/mono && npm install --omit=dev

FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine as runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "run", "start"]