// _____________________________________________________
//JWT Authentication Middleware
// Protects routes by verifying JWT tokens and extracting user info
// Ensures only authenticated users can acces protected endpoints
// ___________________________________________________________________

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, acces denied' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format, acces denied' 
      });
    }

//--------------------------------------------------------------



    // _____________________________________________________________________
    //  Token Verification Process
    // Verify JWT token and extract user information
    // ______________________________________________________________
    
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token valid but user not found' 
      });
    }

    req.user = user;


    next(); 
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Handle errors
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
};///--------------------------------------------------------------




//_____________
//Helpers
//__________________________
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    req.user = user || null;
    next();
    
  } catch (error) {

    req.user = null;
    next();
  }
};
//--------------------------------------------------------------


module.exports = { auth, optionalAuth };