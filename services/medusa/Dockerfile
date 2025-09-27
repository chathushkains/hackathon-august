FROM node:18-alpine

WORKDIR /app

# Install Medusa CLI
RUN npm install -g @medusajs/medusa-cli

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 9000

# Start Medusa
CMD ["medusa", "develop"]
