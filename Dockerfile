FROM node:18

WORKDIR /app
#copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
#copy frontend
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

# Copy source files
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Build frontend 
WORKDIR /app/frontend
RUN npm run build

# Expose ports 
EXPOSE 4040 5000

WORKDIR /app

# Start both
CMD ["sh", "-c", "cd backend && npm start & cd frontend && npm start"]