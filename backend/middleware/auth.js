// _____________________________________________________________
// MARKS: JWT Authentication Middleware
// Protects routes by verifying JWT tokens and extracting user info
// Ensures only authenticated users can acces protected endpoints
// _____________________________________________________________

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Main authentication middleware function
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    // Check if no token provided
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, acces denied' 
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format, acces denied' 
      });
    }

    // _____________________________________________________________
    // MARKS: Token Verification Process
    // Verify JWT token and extract user information
    // _____________________________________________________________
    
    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token valid but user not found' 
      });
    }

    // Add user to request object for use in protected routes
    req.user = user;
    next(); // Continue to next middleware/route handler
    
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Handle diferent types of JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expird' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Server error during authentication' 
      });
    }
  }
};

// _____________________________________________________________
// MARKS: Optional Authentication Middleware
// Allows routes to work with or without authentication
// Usefull for public routes that show diferent content for logged in users
// _____________________________________________________________

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // If no token, continue without setting req.user
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token, but don't fail if invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    req.user = user || null;
    next();
    
  } catch (error) {
    // If token verification fails, just continue without user
    req.user = null;
    next();
  }
};

module.exports = { auth, optionalAuth };