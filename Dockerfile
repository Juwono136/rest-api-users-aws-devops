# --- Build Stage ---
FROM node:alpine3.20 AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

COPY . .


# --- Production Stage ---
FROM node:alpine3.20

WORKDIR /app

# Only install production dependencies for a smaller, safer image
COPY package*.json ./
RUN npm install --only=production

# Copy the app from the 'builder' stage
COPY --from=builder /app .

# Expose the port
EXPOSE 5000

# run the app
CMD ["node", "index.js"]