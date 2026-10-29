FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY api/ ./api/
COPY data/ ./data/
COPY server.js ./

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
