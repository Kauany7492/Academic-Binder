FROM node:18-alpine

WORKDIR /app

# Instala dependências do sistema necessárias para o sharp (processamento de imagens)
RUN apk add --no-cache vips-dev

# Copia apenas os arquivos de dependências primeiro (aproveita cache)
COPY package*.json ./

# Instala apenas as dependências de produção
RUN npm ci --only=production

# Copia o restante do código
COPY . .

# Cria as pastas necessárias para uploads e áudios
RUN mkdir -p uploads/podcasts uploads/pdfs audio uploads/temp

# Expõe a porta da aplicação
EXPOSE 3000

# Comando de inicialização
CMD ["node", "server.js"]
