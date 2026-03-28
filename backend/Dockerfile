FROM node:20-alpine

WORKDIR /app

# Instala dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copia código fonte
COPY src ./src

# Variáveis de ambiente padrão (serão sobrescritas pelo EasyPanel)
ENV NODE_ENV=production
ENV PORT=3001

# Porta exposta
EXPOSE 3001

CMD ["node", "src/app.js"]
