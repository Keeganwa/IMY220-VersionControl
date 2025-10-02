// _____________________________________________________________
// MARKS: Main Server Configuration
// Express server setup with MongoDB connection and route handling
// Includes middleware for CORS, JSON parsing, and authentication
// _____________________________________________________________

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// _____________________________________________________________
// MARKS: Database Connection
// Connect to MongoDB using connection string from .env file
// _____________________________________________________________
connectDB();

// _____________________________________________________________
// MARKS: Middleware Configuration
// Set up CORS, JSON parsing, and request logging
// _____________________________________________________________

// Enable CORS for frontend communication
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'http://localhost:4040' 
    : ['http://localhost:3000', 'http://localhost:4040'],
  credentials: true
}));

// Parse JSON requests
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debuging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// _____________________________________________________________
// MARKS: API Routes Configuration
// Mount all route handlers with /api prefix
// _____________________________________________________________

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const activityRoutes = require('./routes/activities');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);

// _____________________________________________________________
// MARKS: Health Check Endpoint
// Simple endpoint to verify server is runing correctly
// _____________________________________________________________
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is runing correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// _____________________________________________________________
// MARKS: 404 Handler
// Handle requests to non-existent endpoints
// _____________________________________________________________
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path
    });
  }
  next();
});

// _____________________________________________________________
// MARKS: Global Error Handler
// Catch all errors and return apropriate responses
// _____________________________________________________________
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Default server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// _____________________________________________________________
// MARKS: Server Startup
// Start the Express server on configured port
// _____________________________________________________________
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server runing on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// _____________________________________________________________
// MARKS: Graceful Shutdown
// Handle process termination gracefuly
// _____________________________________________________________
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefuly...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefuly...');
  process.exit(0);
});