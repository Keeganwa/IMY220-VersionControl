FROM node:18

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copy frontend files
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

# Copy all source files
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Expose ports
EXPOSE 4040 5000

# Start both servers
WORKDIR /app
CMD ["sh", "-c", "cd backend && npm start & cd frontend && npm start"]