// _____________________________________________________________
// Discussion Board Routes
// ________________________
const express = require('express');
const Discussion = require('../models/Discussion');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const router = express.Router();

// _____________________________________________________________
// Get All Discussions for a Project
// GET /api/discussions/project/:projectId
// _____________________________________________________________
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const discussions = await Discussion.find({ project: projectId })
      .populate('user', 'username email')
      .populate('parentComment')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      discussions
    });

  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching discussions'
    });
  }
});

// _____________________________________________________________
// Create New Discussion/Comment
// POST /api/discussions
// _____________________________________________________________
router.post('/', auth, async (req, res) => {
  try {
    const { project, message, parentComment } = req.body;

    // exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const discussion = new Discussion({
      project,
      user: req.user._id,
      message,
      parentComment: parentComment || null
    });

    await discussion.save();

    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('user', 'username email')
      .populate('parentComment');

    res.status(201).json({
      success: true,
      message: 'Discussion posted successfully',
      discussion: populatedDiscussion
    });

  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating discussion'
    });
  }
});

// _____________________________________________________________
// Update Discussion
// PUT /api/discussions/:id
// _____________________________________________________________
router.put('/:id', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Only creator 
    if (discussion.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can edit this comment'
      });
    }

    const { message } = req.body;
    discussion.message = message;
    await discussion.save();

    const updated = await Discussion.findById(discussion._id)
      .populate('user', 'username email');

    res.json({
      success: true,
      message: 'Discussion updated successfully',
      discussion: updated
    });

  } catch (error) {
    console.error('Update discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating discussion'
    });
  }
});

// _____________________________________________________________
// Delete Discussion
// DELETE /api/discussions/:id
// _____________________________________________________________
router.delete('/:id', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Only creator 
    if (discussion.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can delete this comment'
      });
    }

 
    await Discussion.deleteMany({ parentComment: discussion._id });

    
    await Discussion.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Discussion deleted successfully'
    });

  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting discussion'
    });
  }
});

module.exports = router;