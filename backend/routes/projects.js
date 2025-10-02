// backend/routes/projects.js

// _____________________________________________________________
// MARKS: Project Management Routes
// Handles project CRUD operations, file managment, and colaboration
// Includes project creation, editing, and check-in/check-out functionality
// _____________________________________________________________

const express = require('express');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// _____________________________________________________________
// MARKS: Get All Projects Endpoint
// GET /api/projects - Returns projects based on feed type
// _____________________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    const { feed = 'global', search } = req.query;
    let query = {};

    // Build query based on feed type
    if (feed === 'local') {
      // Show projects from user and their friends
      const userFriends = req.user.friends || [];
      const allowedUsers = [req.user._id, ...userFriends];
      
      query = {
        $or: [
          { creator: { $in: allowedUsers } },
          { collaborators: req.user._id }
        ]
      };
    } else {
      // Global feed - show all public projects
      query = { isPublic: true };
    }

    // Add search functionality
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    const projects = await Project.find(query)
      .populate('creator', 'username email')
      .populate('collaborators', 'username email')
      .populate('checkedOutBy', 'username')
      .sort({ updatedAt: -1 })
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

// _____________________________________________________________
// MARKS: Create New Project
// POST /api/projects - Creates a new project
// _____________________________________________________________
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, tags = [], isPublic = true } = req.body;

    const project = new Project({
      name,
      description,
      creator: req.user._id,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      isPublic,
      files: [], // Start with empty files aray
      collaborators: []
    });

    await project.save();

    // Add project to user's owned projects
    req.user.ownedProjects.push(project._id);
    await req.user.save();

    // Create activity record
    await Activity.create({
      user: req.user._id,
      action: 'created_project',
      project: project._id,
      details: `Created project: ${name}`
    });

    const populatedProject = await Project.findById(project._id)
      .populate('creator', 'username email')
      .populate('collaborators', 'username email');

    res.status(201).json({
      success: true,
      message: 'Project created succesfully',
      project: populatedProject
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project'
    });
  }
});

// _____________________________________________________________
// MARKS: Get Single Project
// GET /api/projects/:id - Returns specific project details
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

// _____________________________________________________________
// MARKS: Update Project
// PUT /api/projects/:id - Updates project details
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

// _____________________________________________________________
// MARKS: Delete Project Endpoint
// DELETE /api/projects/:id - Deletes a project (creator only)
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

    // Remove project from creator's owned projects
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { ownedProjects: project._id }
    });

    // Remove project from collaborators' shared projects
    await User.updateMany(
      { _id: { $in: project.collaborators } },
      { $pull: { sharedProjects: project._id } }
    );

    // Delete all activities related to this project
    await Activity.deleteMany({ project: project._id });

    // Delete the project
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
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const { message, files = [] } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only the user who checked out can check in
    if (!project.checkedOutBy || project.checkedOutBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You have not checked out this project'
      });
    }

    // Update files if provided
    if (files.length > 0) {
      files.forEach(file => {
        const existingFileIndex = project.files.findIndex(f => f.name === file.name);
        
        if (existingFileIndex !== -1) {
          // Update existing file
          project.files[existingFileIndex] = {
            ...project.files[existingFileIndex],
            size: file.size,
            content: file.content,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
          };
        } else {
          // Add new file
          project.files.push({
            name: file.name,
            size: file.size,
            content: file.content,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
          });
        }
      });
    }

    // Clear checkout status
    project.checkedOutBy = null;
    project.checkedOutAt = null;
    await project.save();

    // Create check-in activity
    await Activity.createCheckInActivity(
      req.user._id,
      project._id,
      message,
      files.map(f => f.name).join(', ')
    );

    res.json({
      success: true,
      message: 'Project checked in succesfully'
    });

  } catch (error) {
    console.error('Checkin project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking in project'
    });
  }
});

module.exports = router;