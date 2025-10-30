const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { uploadProjectFiles, handleMulterError, projectFilesDir, projectImagesDir } = require('../middleware/upload');

// _____________________________________________________________
// Get All Projects with Search and Feed Type
// GET /api/projects?feed=local|global&search=term
// _____________________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    const { feed, search } = req.query;
    let query = {};

    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Apply feed filter
    if (feed === 'local') {
      const user = await User.findById(req.user._id);
      const friendIds = user.friends || [];
      query.$or = [
        { creator: { $in: [...friendIds, req.user._id] } },
        { collaborators: { $in: [...friendIds, req.user._id] } }
      ];
    }

    const projects = await Project.find(query)
      .populate('creator', 'username email')
      .populate('collaborators', 'username email')
      .populate('checkedOutBy', 'username email')
      .sort({ updatedAt: -1 });

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
// Get Project by ID
// GET /api/projects/:id
// _____________________________________________________________
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('collaborators', 'username email')
      .populate('checkedOutBy', 'username email')
      .populate('files.uploadedBy', 'username email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
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
// Create New Project
// POST /api/projects
// _____________________________________________________________
router.post('/', auth, (req, res, next) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        if (file.fieldname === 'image') {
          cb(null, projectImagesDir);
        } else {
          cb(null, projectFilesDir);
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    }),
    limits: {
      fileSize: (req, file, cb) => {
        if (file.fieldname === 'image') {
          cb(null, 5 * 1024 * 1024);
        } else {
          cb(null, 50 * 1024 * 1024);
        }
      }
    },
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'image') {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed for project image'));
        }
      } else {
        cb(null, true);
      }
    }
  }).fields([
    { name: 'image', maxCount: 1 },
    { name: 'files', maxCount: 100 }
  ]);

  upload(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, description, tags, type, version, isPublic } = req.body;

    if (!name || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and type are required'
      });
    }

    let tagsArray = [];
    if (tags) {
      tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    const projectData = {
      name,
      description,
      tags: tagsArray,
      type,
      version: version || '1.0.0',
      isPublic: isPublic === 'true' || isPublic === true,
      creator: req.user._id,
      collaborators: [],
      files: []
    };

    if (req.files && req.files.image && req.files.image[0]) {
      projectData.image = `/uploads/images/${req.files.image[0].filename}`;
    }

    if (req.files && req.files.files) {
      projectData.files = req.files.files.map(file => ({
        name: file.originalname,
        path: `/uploads/projects/${file.filename}`,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      }));
    }

    const project = new Project(projectData);
    await project.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { ownedProjects: project._id }
    });

    await Activity.create({
      user: req.user._id,
      action: 'created_project',
      project: project._id,
      details: `Created project: ${project.name}`
    });

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

// _____________________________________________________________
// Update Project
// PUT /api/projects/:id
// _____________________________________________________________
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, tags, type, isPublic } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can update project details'
      });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (tags) project.tags = tags;
    if (type) project.type = type;
    if (isPublic !== undefined) project.isPublic = isPublic;

    await project.save();

    await Activity.create({
      user: req.user._id,
      action: 'updated_project',
      project: project._id,
      details: `Updated project: ${project.name}`
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
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
// Delete Project
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

    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can delete the project'
      });
    }

    // Delete project files from filesystem
    for (const file of project.files) {
      const filePath = path.join(__dirname, '..', file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete project image
    if (project.image) {
      const imagePath = path.join(__dirname, '..', project.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Project.findByIdAndDelete(req.params.id);
    await Activity.deleteMany({ project: req.params.id });
    await User.updateMany(
      { $or: [{ ownedProjects: req.params.id }, { sharedProjects: req.params.id }] },
      { $pull: { ownedProjects: req.params.id, sharedProjects: req.params.id } }
    );

    res.json({
      success: true,
      message: 'Project deleted successfully'
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
// Checkout Project
// POST /api/projects/:id/checkout
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

    const isCollaborator = project.collaborators.some(
      collab => collab.toString() === req.user._id.toString()
    );
    const isOwner = project.creator.toString() === req.user._id.toString();

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Only project members can check out the project'
      });
    }

    if (project.checkedOutBy) {
      return res.status(400).json({
        success: false,
        message: 'Project is already checked out by another user'
      });
    }

    project.checkedOutBy = req.user._id;
    await project.save();

    await Activity.create({
      user: req.user._id,
      action: 'checked_out',
      project: project._id,
      details: `Checked out project: ${project.name}`
    });

    await project.populate('creator collaborators checkedOutBy');

    res.json({
      success: true,
      message: 'Project checked out successfully',
      project
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during checkout'
    });
  }
});

// _____________________________________________________________
// Checkin Project
// POST /api/projects/:id/checkin
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
    const projectId = req.params.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Check-in message is required'
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.checkedOutBy || project.checkedOutBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the user who checked out the project can check it in'
      });
    }

    // REPLACE all files (delete old ones from filesystem)
    for (const oldFile of project.files) {
      const oldFilePath = path.join(__dirname, '..', oldFile.path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Set new files (replaces old array)
    const newFiles = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: `/uploads/projects/${file.filename}`,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    })) : [];

    project.files = newFiles;
    project.checkedOutBy = null;
    project.version = version || project.version;
    project.updatedAt = new Date();

    await project.save();

    await Activity.create({
      user: req.user._id,
      action: 'checked_in',
      project: project._id,
      message: message,
      details: `Checked in project: ${project.name}`
    });

    await project.populate('creator collaborators checkedOutBy');

    res.json({
      success: true,
      message: 'Project checked in successfully',
      project
    });

  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in'
    });
  }
});

// _____________________________________________________________
// Download All Project Files as ZIP
// GET /api/projects/:id/download-all
// _____________________________________________________________
router.get('/:id/download-all', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No files available for download'
      });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment(`${project.name}_files.zip`);
    archive.pipe(res);

    for (const file of project.files) {
      const filePath = path.join(__dirname, '..', file.path);
      
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file.name });
      }
    }

    await archive.finalize();

  } catch (error) {
    console.error('Download all files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download files'
    });
  }
});

// _____________________________________________________________
// Download Single File
// GET /api/projects/:id/files/:fileName
// _____________________________________________________________
router.get('/:id/files/:fileName', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const file = project.files.find(f => f.name === req.params.fileName);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = path.join(__dirname, '..', file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(filePath, file.name);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
});

// _____________________________________________________________
// Add Collaborator
// POST /api/projects/:id/collaborators
// _____________________________________________________________
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isCollaborator = project.collaborators.some(
      collab => collab.toString() === req.user._id.toString()
    );
    const isOwner = project.creator.toString() === req.user._id.toString();

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Only project members can add collaborators'
      });
    }

    if (project.collaborators.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator'
      });
    }

    project.collaborators.push(userId);
    await project.save();

    await User.findByIdAndUpdate(userId, {
      $push: { sharedProjects: project._id }
    });

    await Activity.create({
      user: req.user._id,
      action: 'added_collaborator',
      project: project._id,
      details: `Added collaborator to project: ${project.name}`
    });

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      project
    });

  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding collaborator'
    });
  }
});

// _____________________________________________________________
// Remove Collaborator
// DELETE /api/projects/:id/collaborators/:userId
// _____________________________________________________________
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can remove collaborators'
      });
    }

    project.collaborators = project.collaborators.filter(
      collab => collab.toString() !== req.params.userId
    );
    await project.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { sharedProjects: project._id }
    });

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
      project
    });

  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing collaborator'
    });
  }
});

// _____________________________________________________________
// Transfer Ownership
// PUT /api/projects/:id/transfer-ownership
// _____________________________________________________________
router.put('/:id/transfer-ownership', auth, async (req, res) => {
  try {
    const { newOwnerId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can transfer ownership'
      });
    }

    const isCollaborator = project.collaborators.some(
      collab => collab.toString() === newOwnerId
    );

    if (!isCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'New owner must be a collaborator'
      });
    }

    const oldOwnerId = project.creator;
    project.creator = newOwnerId;
    project.collaborators = project.collaborators.filter(
      collab => collab.toString() !== newOwnerId
    );
    project.collaborators.push(oldOwnerId);

    await project.save();

    await User.findByIdAndUpdate(oldOwnerId, {
      $pull: { ownedProjects: project._id },
      $push: { sharedProjects: project._id }
    });

    await User.findByIdAndUpdate(newOwnerId, {
      $pull: { sharedProjects: project._id },
      $push: { ownedProjects: project._id }
    });

    await Activity.create({
      user: req.user._id,
      action: 'transferred_ownership',
      project: project._id,
      details: `Transferred ownership of project: ${project.name}`
    });

    res.json({
      success: true,
      message: 'Ownership transferred successfully',
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

module.exports = router;