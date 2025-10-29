// _____________________________________________________________
// User Model 
// _____________________________________________________________

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({



  // !!!
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


//!!!


  dateOfBirth: {
    type: Date,
    required: true
  },
  occupation: {
    type: String,
    required: true
  },
 
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],


  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  ownedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],

  sharedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],

  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true 
});

// _____________________________________________________________
//  Password Hashing 


// _____________________________________________________________


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Hash  cost =12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

//--------------------------------------------------------------




// _____________________________________________________________
// Password Validation

// _____________________________________________________________
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password; // Remove password in responce
  return user;
};

//--------------------------------------------------------------
module.exports = mongoose.model('User', userSchema);