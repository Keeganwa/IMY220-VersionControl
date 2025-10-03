// _____________________________________________________________
// Authentication Routes with JWT
// _____________________________________________________________

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// _____________________________________________________________
//  Register User  
// POST /api/auth/signup 
// _____________________________________________________________
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, dateOfBirth, occupation } = req.body;

    // if user already exsts
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username alredy exists'
      });
    }

    
    const user = new User({
      username,
      email,
      password,
      dateOfBirth: new Date(dateOfBirth),
      occupation
    });

    await user.save();



    // Generate JWT token+++
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User created succesfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        occupation: user.occupation,
        dateOfBirth: user.dateOfBirth
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registraton'
    });
  }
});
//--------------------------------------------------------------




// _____________________________________________________________
//  sign in User  
// POST /api/auth/signin 
// _____________________________________________________________
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentals'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentals'
      });
    }

    // Generate JWT token+++
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );


    res.json({
      success: true,
      message: 'Login succesful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        occupation: user.occupation,
        dateOfBirth: user.dateOfBirth
      }
    });


  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});
//--------------------------------------------------------------

// _____________________________________________________________
//  Current User 
// GET /api/auth/me 
// _____________________________________________________________
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email')
      .populate('ownedProjects', 'name description')
      .populate('sharedProjects', 'name description');

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user data'
    });
  }
});
//--------------------------------------------------------------
module.exports = router;