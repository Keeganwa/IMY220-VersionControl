// _____________________________________________________________
// MARKS: Project Model Schema
// Defines the structure of project documents in MongoDB
// Includes project metadata, colaborators, and file managment
// _____________________________________________________________

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is requierd'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: 500
  },
  // User who created the projct
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Array of users who can colaborate on this project
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Project tags for searching and categorization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Project visibilty settings
  isPublic: {
    type: Boolean,
    default: true
  },
  // Files stored in this project
  files: [{
    name: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    // File content or path (simplified for this deliverabel)
    content: {
      type: String,
      default: ''
    }
  }],
  // Current user who has checked out the project for editting
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  checkedOutAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automaticaly
});

// _____________________________________________________________
// MARKS: Project Helper Methods
// Methods for managing project colaboration and file access
// _____________________________________________________________

// Check if user is colaborator or owner
projectSchema.methods.hasAccess = function(userId) {
  return this.creator.toString() === userId.toString() || 
         this.collaborators.includes(userId);
};

// Check if project is availabe for checkout
projectSchema.methods.isAvailableForCheckout = function() {
  return !this.checkedOutBy;
};

module.exports = mongoose.model('Project', projectSchema);


