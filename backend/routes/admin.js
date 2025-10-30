// _____________________________________________________________
// Admin Routes
// ________________________
const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Discussion = require('../models/Discussion');
const { auth } = require('../middleware/auth');
const router = express.Router();

// _____________________________________________________________
// Admin check
// _____________________________________________________________
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error checking admin status'
    });
  }
};

// _____________________________________________________________
// Get All Users (Admin)
// GET /api/admin/users
// ____________________________________________
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// _____________________________________________________________
// Delete User (Admin)
// DELETE /api/admin/users/:id
// ____________________________________
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
//DELETE SELF GUARD
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await Project.deleteMany({ creator: user._id });

   
    await Project.updateMany(
      { collaborators: user._id },
      { $pull: { collaborators: user._id } }
    );

    // Delete user's activities--------------------
    await Activity.deleteMany({ user: user._id });

    // Delete user's discussions----------------------
    await Discussion.deleteMany({ user: user._id });

    // Remove from friends lists--------------------------
    await User.updateMany(
      { friends: user._id },
      { $pull: { friends: user._id } }
    );

    // Delete user----------------------------------------
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// _____________________________________________________________
// Delete Project (Admin)
// DELETE /api/admin/projects/:id
// _____________________________________________________________
router.delete('/projects/:id', auth, isAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

   
    await User.findByIdAndUpdate(project.creator, {
      $pull: { ownedProjects: project._id }
    });
    
    await User.updateMany(
      { _id: { $in: project.collaborators } },
      { $pull: { sharedProjects: project._id } }
    );

   
    await Activity.deleteMany({ project: project._id });
    await Discussion.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project'
    });
  }
});

// _____________________________________________________________
// Delete Activity (Admin)
// DELETE /api/admin/activities/:id
// _____________________________________________________________
router.delete('/activities/:id', auth, isAdmin, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting activity'
    });
  }
});

// _____________________________________________________________
// Add Project Type (Admin)
// POST /api/admin/project-types
// _____________________________________________________________
const projectTypes = [
  'Web Application',
  'Mobile Application',
  'Desktop Application',
  'Library',
  'Framework',
  'API',
  'CLI Tool',
  'Other'
];

router.get('/project-types', auth, async (req, res) => {
  res.json({
    success: true,
    types: projectTypes
  });
});

router.post('/project-types', auth, isAdmin, async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || projectTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or duplicate project type'
      });
    }

    projectTypes.push(type);

    res.json({
      success: true,
      message: 'Project type added successfully',
      types: projectTypes
    });

  } catch (error) {
    console.error('Add project type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding project type'
    });
  }
});

// _____________________________________________________________
// Update User (Admin)
// PUT /api/admin/users/:id
// _____________________________________________________________
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { username, email, occupation, isAdmin } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, occupation, isAdmin },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

module.exports = router;