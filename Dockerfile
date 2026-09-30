FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY server ./server
COPY config ./config
COPY prompts ./prompts
COPY schemas ./schemas
USER node
EXPOSE 8080
CMD ["node", "server/index.js"]
