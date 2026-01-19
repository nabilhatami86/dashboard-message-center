FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# For development, use Next.js default dev server (avoiding custom server issues in Docker)
CMD ["npm", "run", "dev:default"]
