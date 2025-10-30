

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

 
  type: {
    type: String,
    required: [true, 'Project type is required'],
    trim: true
  },


  image: {
    type: String,
    default: null
  },


  version: {
    type: String,
    default: '1.0.0'
  },


  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],


  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  // Files stored
  files: [{
    name: {
      type: String,
      required: true
    },
    path: {
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
    // File content 
    content: {
      type: String,
      default: ''
    }
  }],
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
  timestamps: true 
});
//-------------------------------------------------------------


// _____________________________________________________________
//  Project Helper 
// ____________________


projectSchema.methods.hasAccess = function(userId) {
  return this.creator.toString() === userId.toString() || 
         this.collaborators.includes(userId);
};


//  if project availabe
projectSchema.methods.isAvailableForCheckout = function() {
  return !this.checkedOutBy;
};

//--------------------------------------------------------------


module.exports = mongoose.model('Project', projectSchema);


