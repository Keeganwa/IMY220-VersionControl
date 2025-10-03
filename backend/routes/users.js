

// _____________________________________________________________
// User Manage 
// _____________________________________________________________

const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// _____________________________________________________________
//  Get All Users Endpoint
// GET /api/users 
// _____________________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // search ter
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { occupation: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('username email occupation dateOfBirth createdAt')
      .limit(50);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});
//--------------------------------------------------------------



// _____________________________________________________________
// Single User Profile
// GET /api/users/:id 
// _____________________________________________________________
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('friends', 'username email occupation')
      .populate('ownedProjects', 'name description createdAt')
      .populate('sharedProjects', 'name description createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profil'
    });
  }
});
//--------------------------------------------------------------




// _____________________________________________________________
// Update Profile
// PUT /api/users/profile 
// _____________________________________________________________
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email, occupation, dateOfBirth } = req.body;
    
    // Check if taken 
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.user._id } }, // Not current user
        { $or: [{ email }, { username }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email alredy taken by another user'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username, email, occupation, dateOfBirth },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated succesfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profil'
    });
  }
});
//--------------------------------------------------------------


// _____________________________________________________________
// Friend Request
// POST /api/users/:id/friend-request 
// _____________________________________________________________
router.post('/:id/friend-request', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // Can't send request to yourself
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (targetUser.friends.includes(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    // Check if request already sent
    if (targetUser.friendRequests.includes(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Friend request alredy sent'
      });
    }

    // Add friend request
    targetUser.friendRequests.push(currentUserId);
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request sent succesfully'
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending friend request'
    });
  }
});
//--------------------------------------------------------------



// _____________________________________________________________
// Accept Friend Request
// POST /api/users/accept-friend/:id - 
// _____________________________________________________________
router.post('/accept-friend/:id', auth, async (req, res) => {
  try {
    const friendId = req.params.id;
    const currentUser = await User.findById(req.user._id);

    // if  request exists
    if (!currentUser.friendRequests.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: 'No friend request from this user'
      });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add each other
    currentUser.friends.push(friendId);
    friend.friends.push(currentUser._id);



    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== friendId
    );

    await currentUser.save();
    await friend.save();

    res.json({
      success: true,
      message: 'Friend request accepted succesfully'
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accepting friend request'
    });
  }
});
//--------------------------------------------------------------



// _____________________________________________________________
//  Unfriend User 
// DELETE /api/users/unfriend/:id 
// _____________________________________________________________
router.delete('/unfriend/:id', auth, async (req, res) => {
  try {
    const friendId = req.params.id;
    const currentUser = await User.findById(req.user._id);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if they are actually friends
    if (!currentUser.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not friends with this user'
      });
    }

    // Remove each other from friends lists
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== friendId
    );
    friend.friends = friend.friends.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await friend.save();

    res.json({
      success: true,
      message: 'Friend removed succesfully'
    });

  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing friend'
    });
  }
});

module.exports = router;