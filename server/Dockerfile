# Use official Node.js LTS
FROM node:20-alpine

WORKDIR /app

# copy package files and install deps
COPY package*.json ./
RUN npm install --production

# copy source code
COPY . .

# expose port (default 3000)
ENV PORT=3000
EXPOSE 3000

# start server
CMD ["npm", "start"]
