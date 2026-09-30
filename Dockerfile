# Stage 1: build the web app. Stage 2: the API, which also serves the built web app from dist/.
FROM node:22-slim AS web
WORKDIR /w
COPY package.json package-lock.json ./
RUN npm ci
COPY web ./web
COPY data ./data
COPY config ./config
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY server ./server
COPY config ./config
COPY prompts ./prompts
COPY schemas ./schemas
COPY --from=web /w/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "server/index.js"]
