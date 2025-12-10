FROM node:20-alpine

WORKDIR /app

# Copy only dependency files first (for layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy source code
COPY . .

# Prevent root execution (security)
USER node

# Start worker
CMD ["npm", "run", "start:worker"]
