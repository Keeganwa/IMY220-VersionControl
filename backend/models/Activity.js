// _____________________________________________________________
// MARKS: Activity Model Schema
// Defines the structure of activity/check-in documents in MongoDB
// Tracks all user actions and project check-in/check-out mesages
// _____________________________________________________________

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  // User who performed the activty
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Type of activity performed
  action: {
    type: String,
    required: true,
    enum: [
      'uploaded',
      'downloaded', 
      'edited',
      'deleted',
      'checked_in',
      'checked_out',
      'created_project',
      'joined_project',
      'left_project'
    ]
  },
  // Project related to this activty (if applicable)
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  // File name if activity is file-related
  fileName: {
    type: String,
    required: false
  },
  // Check-in message when user checks in code changes
  message: {
    type: String,
    required: false,
    maxlength: 500
  },
  // Additional details about the activty
  details: {
    type: String,
    required: false,
    maxlength: 200
  },
  // IP address for security tracking (optional)
  ipAddress: {
    type: String,
    required: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automaticaly
});

// _____________________________________________________________
// MARKS: Activity Indexes
// Database indexes for eficient querying by user and project
// _____________________________________________________________

// Index for fast user activity lookup
activitySchema.index({ user: 1, createdAt: -1 });

// Index for fast project activity lookup  
activitySchema.index({ project: 1, createdAt: -1 });

// Index for searching by action type
activitySchema.index({ action: 1, createdAt: -1 });

// _____________________________________________________________
// MARKS: Activity Helper Methods
// Static methods for creating diferent types of activities
// _____________________________________________________________

// Create file-related activity
activitySchema.statics.createFileActivity = function(userId, action, projectId, fileName, details = '') {
  return this.create({
    user: userId,
    action: action,
    project: projectId,
    fileName: fileName,
    details: details
  });
};

// Create check-in activity with mesage
activitySchema.statics.createCheckInActivity = function(userId, projectId, message, fileName = '') {
  return this.create({
    user: userId,
    action: 'checked_in',
    project: projectId,
    fileName: fileName,
    message: message
  });
};

module.exports = mongoose.model('Activity', activitySchema);