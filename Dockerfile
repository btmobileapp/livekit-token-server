FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
//RUN npm ci
COPY token_server.js .
EXPOSE 3001
CMD ["node", "token_server.js"]
