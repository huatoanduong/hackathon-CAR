FROM node:20-alpine AS build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend ./
COPY data /app/data
RUN npm run build

FROM node:20-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/src/db/migrations ./dist/db/migrations
COPY --from=build /app/data /app/data
EXPOSE 3000
CMD ["node", "dist/api/server.js"]
