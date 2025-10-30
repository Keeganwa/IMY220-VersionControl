const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  // User 
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
      'left_project',
      'transferred_ownership',
      'updated_project',
      'deleted_project',
      'added_collaborator',
      'removed_collaborator',
      'uploaded_file',
      'deleted_file'
    ]
  },

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },

  fileName: {
    type: String,
    required: false
  },

  message: {
    type: String,
    required: false,
    maxlength: 500
  },
  
  details: {
    type: String,
    required: false,
    maxlength: 200
  }
}, {
  timestamps: true
});

//--------------------------------------------------------------

// Activity Index
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });

activitySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'project',
    select: 'name image tags creator'
  }).populate({
    path: 'user',
    select: 'username email'
  });
  next();
});

// _____________________________________________________________
// Activity Helper Methods
// _____________________________________________________________

activitySchema.statics.createFileActivity = function(userId, action, projectId, fileName, details = '') {
  return this.create({
    user: userId,
    action: action,
    project: projectId,
    fileName: fileName,
    details: details
  });
};

activitySchema.statics.createCheckInActivity = function(userId, projectId, message, fileName = '') {
  return this.create({
    user: userId,
    action: 'checked_in',
    project: projectId,
    fileName: fileName,
    message: message
  });
};

//-------------------------------------------------------------

module.exports = mongoose.model('Activity', activitySchema);