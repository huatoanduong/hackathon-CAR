# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app/backend
COPY backend/package.json backend/yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --cache-folder /usr/local/share/.cache/yarn
COPY backend ./
COPY data /app/data
RUN yarn build

FROM node:20-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package.json backend/yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --production --cache-folder /usr/local/share/.cache/yarn
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/src/db/migrations ./dist/db/migrations
COPY --from=build /app/data /app/data
EXPOSE 3000
CMD ["node", "dist/api/server.js"]
