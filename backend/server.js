// _____________________________________________________________
//  Server
// _________________________________________________________

const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const activityRoutes = require('./routes/activities');
const discussionRoutes = require('./routes/discussions');
const adminRoutes = require('./routes/admin');
 
dotenv.config();

// Init
const app = express();
connectDB();




app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'http://localhost:4040' 
    : ['http://localhost:3000', 'http://localhost:4040'],
  credentials: true
}));



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// _____________________________________________________________
// API Routes Config
// _____________________________________________________________



app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/admin', adminRoutes);

//--------------------------------------------------------------



// _____________________________________________________________
//  Health Check 
// _____________________________________________________________
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is runing correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

//--------------------------------------------------------------

// _____________________________________________________________
//  404 Handler
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
//  Global Error Handler
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
//--------------------------------------------------------------



// _____________________________________________________________
//                        Server Startup
// _____________________________________________________________
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server runing on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// _____________________________________________________________
//       Shutdown

// _____________________________________________________________
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefuly...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefuly...');
  process.exit(0);
});