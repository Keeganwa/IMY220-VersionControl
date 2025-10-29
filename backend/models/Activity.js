
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  // User whoperformed the activty
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Type of activty 
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
    'transferred_ownership'
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
  timestamps: true // createdAt and updatedAt 
});
//--------------------------------------------------------------





// Activity Index

activitySchema.index({ user: 1, createdAt: -1 });
   activitySchema.index({ project: 1, createdAt: -1 });
 activitySchema.index({ action: 1, createdAt: -1 });



// _____________________________________________________________
// Activity Helper Methods
// _____________________________________________________________



// Create file-act
activitySchema.statics.createFileActivity = function(userId, action, projectId, fileName, details = '') {
  return this.create({
    user: userId,
    action: action,
    project: projectId,
    fileName: fileName,
    details: details
  });
};



// Create check-in 
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