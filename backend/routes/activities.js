// _____________________________________________________________
// Activity Routes



const express = require('express');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');
const router = express.Router();

// _____________________________________________________________
//  Feed
// GET /api/activities 
// _____________________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    const { feed = 'global', limit = 50 } = req.query;
    let query = {};

    //local
    if (feed === 'local') {
     
      const userFriends = req.user.friends || [];
      const allowedUsers = [req.user._id, ...userFriends];
      query = { user: { $in: allowedUsers } };
    }
    // Global s 

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
//--------------------------------------------------------------





// _____________________________________________________________
//   Project acts
// GET /api/activities/project/:projectId 
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


//--------------------------------------------------------------




// _____________________________________________________________
// User Activities
// GET /api/activities/user/:userId 
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

//--------------------------------------------------------------




// _____________________________________________________________
// Create Activity
// POST /api/activities 
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
//--------------------------------------------------------------

// _____________________________________________________________
//Search Activities
// GET /api/activities/search
// _____________________________________________________________
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json({
        success: true,
        activities: []
      });
    }

   
    const activities = await Activity.find({
      message: { $regex: query, $options: 'i' }
    })
      .populate('user', 'username email')
      .populate('project', 'name description image tags')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Search activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching activities'
    });
  }
});


module.exports = router;