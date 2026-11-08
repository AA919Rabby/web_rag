# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create the uploads directory for handling PDF uploads
RUN mkdir -p uploads

# Expose the port (Render provides PORT via environment variable)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]