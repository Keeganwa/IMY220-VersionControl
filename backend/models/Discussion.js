// ____________________________________________ _________________
// Discussion Model
// ________________________________________

const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // User who posted the discussion
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Discussion msg
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Parent cmt
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    default: null
  }
}, {
  timestamps: true 
});

// _________________________
// Indexes

discussionSchema.index({ project: 1, createdAt: -1 });
discussionSchema.index({ user: 1 });
discussionSchema.index({ parentComment: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);