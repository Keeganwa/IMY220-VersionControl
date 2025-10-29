// _____________________________________________________________
// Discussion Model
// _____________________________________________________________

const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  // Project this discussion belongs to
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
  
  // Discussion message content
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Parent comment for replies (null if top-level comment)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    default: null
  }
}, {
  timestamps: true // createdAt and updatedAt
});

// _____________________________________________________________
// Indexes for Performance
// _____________________________________________________________
discussionSchema.index({ project: 1, createdAt: -1 });
discussionSchema.index({ user: 1 });
discussionSchema.index({ parentComment: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);