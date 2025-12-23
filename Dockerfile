FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm instal

# Install a simple HTTP server to serve the static files
RUN npm install -g serve

COPY . .

RUN npm run build


# Expose port app
EXPOSE 3001

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3001"]
