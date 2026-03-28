# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variáveis VITE_* são embutidas em build-time pelo Vite
# No EasyPanel, configure-as como "Build Args" (não como env vars de runtime)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
# ⚠️ CRÍTICO: deve ser a URL COMPLETA do backend com /api no final
# Ex: https://vibe-code-backend.uswynw.easypanel.host/api
ARG VITE_API_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────
FROM nginx:alpine

# Copia o build estático
COPY --from=build /app/dist /usr/share/nginx/html

# Copia o template de configuração do Nginx
# O ${BACKEND_URL} será substituído em runtime pelo envsubst
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# A imagem nginx:alpine já executa envsubst automaticamente nos arquivos
# dentro de /etc/nginx/templates/ antes de iniciar o nginx.
# Basta definir a variável BACKEND_URL no EasyPanel.
CMD ["nginx", "-g", "daemon off;"]
