# Use Node.js v24 (matches your local version)
FROM node:24-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install dependencies (tsx is in devDependencies but needed at runtime, so install everything)
RUN npm install

# Copy rest of the project
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# Start the app — matches your package.json: "start": "tsx src/server.ts"
CMD ["npm", "start"]