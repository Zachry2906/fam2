FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production 
# --production = tanpa devDepedencies
COPY . .
CMD ["node", "index.js"]