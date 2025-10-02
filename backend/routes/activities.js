// _____________________________________________________________
// MARKS: Activity Management Routes
// Handles retrieval of user and project activities
// Provides activity feeds for local and global views
// _____________________________________________________________

const express = require('express');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');
const router = express.Router();

// _____________________________________________________________
// MARKS: Get Activities Feed
// GET /api/activities - Returns activity feed based on type
// _____________________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    const { feed = 'global', limit = 50 } = req.query;
    let query = {};

    // Build query based on feed type
    if (feed === 'local') {
      // Show activities from user and their friends
      const userFriends = req.user.friends || [];
      const allowedUsers = [req.user._id, ...userFriends];
      query = { user: { $in: allowedUsers } };
    }
    // Global feed shows all activities (no additional query needed)

    const activities = await Activity.find(query)
      .populate('user', 'username email')
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching activites'
    });
  }
});

// _____________________________________________________________
// MARKS: Get Project-Specific Activities
// GET /api/activities/project/:projectId - Returns activities for specific project
// _____________________________________________________________
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50 } = req.query;

    const activities = await Activity.find({ project: projectId })
      .populate('user', 'username email')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Get project activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching project activites'
    });
  }
});

// _____________________________________________________________
// MARKS: Get User-Specific Activities
// GET /api/activities/user/:userId - Returns activities for specific user
// _____________________________________________________________
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const activities = await Activity.find({ user: userId })
      .populate('user', 'username email')
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user activites'
    });
  }
});

// _____________________________________________________________
// MARKS: Create Manual Activity
// POST /api/activities - Creates a new activity record manually
// _____________________________________________________________
router.post('/', auth, async (req, res) => {
  try {
    const { action, project, fileName, message, details } = req.body;

    const activity = new Activity({
      user: req.user._id,
      action,
      project,
      fileName,
      message,
      details
    });

    await activity.save();

    const populatedActivity = await Activity.findById(activity._id)
      .populate('user', 'username email')
      .populate('project', 'name');

    res.status(201).json({
      success: true,
      message: 'Activity created succesfully',
      activity: populatedActivity
    });

  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating activty'
    });
  }
});

module.exports = router;