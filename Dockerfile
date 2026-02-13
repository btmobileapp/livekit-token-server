FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of files
COPY . .

# Railway provides PORT automatically
ENV PORT=3001

EXPOSE 3001

CMD ["node", "token_server.js"]
