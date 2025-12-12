# Imagem base Node.js
FROM node:20

# Diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia todo o restante do backend
COPY . .

# Expõe a porta do Express
EXPOSE 3000

# Comando para iniciar o backend (produção)
CMD ["npm", "start"]
