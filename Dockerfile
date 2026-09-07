# ---- build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at build time, so the API base must be known here. A relative
# path keeps the image host-agnostic: nginx proxies /api and /ws to the api container.
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
