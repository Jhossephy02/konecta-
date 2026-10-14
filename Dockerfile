FROM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/industries.mjs src/onboarding-context.mjs ./src/
COPY --from=build /app/node_modules ./node_modules
RUN mkdir -p data backups && chown -R node:node /app
USER node
ENV HOST=0.0.0.0 PORT=3001 DB_PATH=/app/data/portal.sqlite
EXPOSE 3001
CMD ["node", "server/index.mjs"]
