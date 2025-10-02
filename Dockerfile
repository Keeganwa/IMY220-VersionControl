FROM node:18

WORKDIR /app

# Copy backend files and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copy frontend files and install dependencies
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

# Copy all source files (excluding node_modules via .dockerignore)
WORKDIR /app
COPY . .
COPY frontend/public/assets/images/ /app/frontend/public/assets/images/
# Build frontend for production
WORKDIR /app/frontend
RUN npm run build

# Expose ports for both frontend and backend
EXPOSE 4040 5000

# Set working directory back to root
WORKDIR /app

# Start both backend and frontend servers
CMD ["sh", "-c", "cd backend && npm start & cd frontend && npm start"]