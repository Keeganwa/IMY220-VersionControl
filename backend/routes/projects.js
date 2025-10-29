// _____________________________________________________________
// Project Manage

// _____________________________________________________________

const express = require('express');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();
const { uploadProjectFiles, uploadProjectImage, handleMulterError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
// _____________________________________________________________
// All Projects 
// GET /api/projects
// _____________________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    const { feed = 'global', search = '' } = req.query;
    let query = {};

    if (feed === 'local') {
      // Get projects user is member of or created
      query = {
        $or: [
          { creator: req.user._id },
          { collaborators: req.user._id }
        ]
      };
    }

    // Enhanced search: name, description, tags, type, OR check-in messages
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Find activities with matching check-in messages
      const matchingActivities = await Activity.find({
        action: 'checked_in',
        message: searchRegex
      }).distinct('project');

      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { type: searchRegex },
        { _id: { $in: matchingActivities } }
      ];
    }

    const projects = await Project.find(query)
      .populate('creator', 'username email')
      .populate('collaborators', 'username email')
      .populate('checkedOutBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching projects'
    });
  }
});
//--------------------------------------------------------------



// _____________________________________________________________
// Create New Project
// POST /api/projects
// _____________________________________________________________
router.post('/', auth, (req, res, next) => {
  uploadProjectImage(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, description, tags, type, version, isPublic } = req.body;

    // Validate required fields
    if (!name || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and type are required'
      });
    }

    // Parse tags if it's a string
    let tagsArray = [];
    if (tags) {
      tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Create project data
    const projectData = {
      name,
      description,
      tags: tagsArray,
      type,
      version: version || '1.0.0',
      isPublic: isPublic === 'true' || isPublic === true,
      creator: req.user._id,
      collaborators: []
    };

    // Add image if uploaded
    if (req.file) {
      projectData.image = `/uploads/images/${req.file.filename}`;
    }

    const project = new Project(projectData);
    await project.save();

    // Add to user's owned projects
    await User.findByIdAndUpdate(req.user._id, {
      $push: { ownedProjects: project._id }
    });

    // Create activity
    await Activity.create({
      user: req.user._id,
      action: 'created_project',
      project: project._id,
      details: `Created project: ${project.name}`
    });

    // Populate creator before sending response
    await project.populate('creator', 'username email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project'
    });
  }
});
//--------------------------------------------------------------




// _____________________________________________________________
//  Single Project
// GET /api/projects/:id
// _____________________________________________________________
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'username email occupation')
      .populate('collaborators', 'username email')
      .populate('checkedOutBy', 'username')
      .populate('files.uploadedBy', 'username');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has acces to view this project
    if (!project.isPublic && !project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    res.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching project'
    });
  }
});
//--------------------------------------------------------------




// _____________________________________________________________
//  Update Project
// PUT /api/projects/:id
// _____________________________________________________________
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only creator can update project details
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only project creator can update project details'
      });
    }

    const { name, description, tags, isPublic } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        isPublic
      },
      { new: true, runValidators: true }
    ).populate('creator', 'username email')
     .populate('collaborators', 'username email');

    res.json({
      success: true,
      message: 'Project updated succesfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating project'
    });
  }
});

//--------------------------------------------------------------




// _____________________________________________________________
//  Delete Project 
// DELETE /api/projects/:id
// _____________________________________________________________
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only creator can delete project
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only project creator can delete project'
      });
    }

  
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { ownedProjects: project._id }
    });
    await User.updateMany(
      { _id: { $in: project.collaborators } },
      { $pull: { sharedProjects: project._id } }
    );
    await Activity.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted succesfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project'
    });
  }
});
//--------------------------------------------------------------

router.put('/:id/transfer-ownership', auth, async (req, res) => {
  try {
    const { newOwnerId } = req.body;
    const project = await Project.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('collaborators', 'username email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only the current owner can transfer ownership
    if (project.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can transfer ownership'
      });
    }

    // Check if new owner ID is provided
    if (!newOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'New owner ID is required'
      });
    }

    // Check if new owner is a collaborator
    const isCollaborator = project.collaborators.some(
      collab => collab._id.toString() === newOwnerId
    );

    if (!isCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'New owner must be a project collaborator'
      });
    }

    // Cannot transfer to yourself
    if (newOwnerId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You are already the owner'
      });
    }

    const oldOwner = project.creator;
    const newOwner = await User.findById(newOwnerId);

    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: 'New owner not found'
      });
    }

    // Remove new owner from collaborators
    project.collaborators = project.collaborators.filter(
      collab => collab._id.toString() !== newOwnerId
    );

    // Add old owner to collaborators
    project.collaborators.push(req.user._id);

    // Transfer ownership
    project.creator = newOwnerId;

    await project.save();

    // Update user's project lists
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { ownedProjects: project._id },
      $addToSet: { sharedProjects: project._id }
    });

    await User.findByIdAndUpdate(newOwnerId, {
      $addToSet: { ownedProjects: project._id },
      $pull: { sharedProjects: project._id }
    });

    // Create activity
    await Activity.create({
      user: req.user._id,
      action: 'transferred_ownership',
      project: project._id,
      details: `Transferred ownership to ${newOwner.username}`
    });

    // Populate again for response
    await project.populate('creator', 'username email');
    await project.populate('collaborators', 'username email');

    res.json({
      success: true,
      message: `Ownership transferred to ${newOwner.username}`,
      project
    });

  } catch (error) {
    console.error('Transfer ownership error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error transferring ownership'
    });
  }
});

// _____________________________________________________________
// MARKS: Project Checkout/Checkin System
// POST /api/projects/:id/checkout - Check out project for editing
// _____________________________________________________________
router.post('/:id/checkout', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has acces
    if (!project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Check if project is available for checkout
    if (!project.isAvailableForCheckout()) {
      return res.status(400).json({
        success: false,
        message: 'Project is alredy checked out by another user'
      });
    }

    // Check out project
    project.checkedOutBy = req.user._id;
    project.checkedOutAt = new Date();
    await project.save();

    // Create activity record
    await Activity.create({
      user: req.user._id,
      action: 'checked_out',
      project: project._id,
      details: 'Checked out project for editing'
    });

    res.json({
      success: true,
      message: 'Project checked out succesfully'
    });

  } catch (error) {
    console.error('Checkout project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking out project'
    });
  }
});

// _____________________________________________________________
// MARKS: Project Check-in with Files
// POST /api/projects/:id/checkin - Check in project with changes
// _____________________________________________________________
router.post('/:id/checkin', auth, (req, res, next) => {
  uploadProjectFiles(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    const { message, version } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only the user who checked it out can check it in
    if (!project.checkedOutBy || project.checkedOutBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only check in a project you have checked out'
      });
    }

    // Validate version format if provided
    if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
      return res.status(400).json({
        success: false,
        message: 'Version must be in format X.Y.Z (e.g., 1.0.0)'
      });
    }

    // Add uploaded files to project
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        name: file.originalname,
        path: `/uploads/projects/${file.filename}`,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      }));

      project.files.push(...newFiles);
    }

    // Update project
    project.checkedOutBy = null;
    if (version) {
      project.version = version;
    }
    await project.save();

    // Create check-in activity
    const activityDetails = [];
    if (req.files && req.files.length > 0) {
      activityDetails.push(`Added ${req.files.length} file(s)`);
    }
    if (version) {
      activityDetails.push(`Updated version to ${version}`);
    }

    await Activity.create({
      user: req.user._id,
      action: 'checked_in',
      project: project._id,
      message: message || 'Checked in project',
      details: activityDetails.join(', ')
    });

    await project.populate('creator', 'username email');
    await project.populate('collaborators', 'username email');
    await project.populate('checkedOutBy', 'username');

    res.json({
      success: true,
      message: 'Project checked in successfully',
      project
    });

  } catch (error) {
    console.error('Check-in project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking in project'
    });
  }
});
//--------------------------------------------------------------


router.get('/:id/files/:fileName', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find file
    const file = project.files.find(f => f.name === req.params.fileName);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file path
    const filePath = path.join(__dirname, '..', file.path);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Create activity for download
    await Activity.create({
      user: req.user._id,
      action: 'downloaded',
      project: project._id,
      fileName: file.name,
      details: `Downloaded ${file.name}`
    });

    // Send file for download
    res.download(filePath, file.name, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file'
          });
        }
      }
    });

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading file'
    });
  }
});


module.exports = router;