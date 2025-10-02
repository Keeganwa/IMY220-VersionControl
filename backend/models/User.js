// _____________________________________________________________
// MARKS: User Model Schema
// Defines the structur of user documents in MongoDB
// Includes authentication fields and user profile informaton
// _____________________________________________________________

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is requierd'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  occupation: {
    type: String,
    required: true
  },
  // Array of user IDs that are frends with this user
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Array of incoming friend request IDs
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Projects this user owns
  ownedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  // Projects this user is a colaborator on
  sharedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt automaticaly
});

// _____________________________________________________________
// MARKS: Password Hashing Middleware
// Automatically hash password before saving to databse
// _____________________________________________________________
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modifed (or is new)
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// _____________________________________________________________
// MARKS: Password Comparison Method
// Instance method to check if provided pasword matches hashed password
// _____________________________________________________________
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitiv information
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password; // Remove password from JSON responce
  return user;
};

module.exports = mongoose.model('User', userSchema);