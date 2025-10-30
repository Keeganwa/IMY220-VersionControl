const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Project = require('../models/Project');  
const Activity = require('../models/Activity'); 
const Discussion = require('../models/Discussion');

// _____________________________________________________________
// Setup Profile Image Upload Directory
// _____________________________________________________________
const uploadDir = path.join(__dirname, '../uploads');
const profileImagesDir = path.join(uploadDir, 'profiles');

if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

// _____________________________________________________________
//  Get All Users Endpoint
// GET /api/users 
// _____________________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // search term
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
      .select('username email occupation dateOfBirth profileImage createdAt')
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
// Get Current User Profile
// GET /api/users/profile
// _____________________________________________________________
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('friends', 'username email profileImage')
      .populate('friendRequests', 'username email profileImage')
      .populate('ownedProjects')
      .populate('sharedProjects');

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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// _____________________________________________________________
// Single User Profile
// GET /api/users/:id 
// _____________________________________________________________
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('friends', 'username email profileImage')
      .populate('friendRequests', 'username email profileImage')
      .populate({
        path: 'ownedProjects',
        populate: [
          { path: 'creator', select: 'username profileImage' },
          { path: 'collaborators', select: 'username profileImage' },
          { path: 'checkedOutBy', select: 'username profileImage' }
        ]
      })
      .populate({
        path: 'sharedProjects',
        populate: [
          { path: 'creator', select: 'username profileImage' },
          { path: 'collaborators', select: 'username profileImage' },
          { path: 'checkedOutBy', select: 'username profileImage' }
        ]
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if requesting user is viewing their own profile
    const isOwnProfile = req.user._id.toString() === req.params.id;

    // Check if requesting user is friends with this user
    const isFriend = user.friends.some(
      friend => friend._id.toString() === req.user._id.toString()
    );

    // If not own profile and not friends, return limited info
    if (!isOwnProfile && !isFriend) {
      return res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email, // Just for friend request purposes
          profileImage: user.profileImage,
          isFriend: false,
          isOwnProfile: false
        },
        limitedProfile: true
      });
    }

    // Return full profile for own profile or friends
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        friends: user.friends,
        friendRequests: isOwnProfile ? user.friendRequests : [], // Only show requests on own profile
        ownedProjects: user.ownedProjects,
        sharedProjects: user.sharedProjects,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
        isFriend: true,
        isOwnProfile: isOwnProfile
      },
      limitedProfile: false
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
});
//--------------------------------------------------------------

// _____________________________________________________________
// Update Profile (with Image Upload)
// PUT /api/users/profile 
// _____________________________________________________________
router.put('/profile', auth, (req, res, next) => {
  // Setup multer for profile image upload
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, profileImagesDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  }).single('profileImage');

  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 5MB.'
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { username, email, occupation, dateOfBirth, bio } = req.body;
    
    // Check if username/email taken by another user
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.user._id } }, // Not current user
        { $or: [{ email }, { username }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already taken by another user'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (occupation) user.occupation = occupation;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (bio !== undefined) user.bio = bio;

    // Handle profile image upload
    if (req.file) {
      // Delete old image if exists
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '..', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.error('Error deleting old profile image:', err);
          }
        }
      }
      // Set new image
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('friends', 'username email profileImage')
      .populate('friendRequests', 'username email profileImage');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
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
        message: 'Friend request already sent'
      });
    }

    // Add friend request
    targetUser.friendRequests.push(currentUserId);
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request sent successfully'
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
// POST /api/users/accept-friend/:id 
// _____________________________________________________________
router.post('/accept-friend/:id', auth, async (req, res) => {
  try {
    const friendId = req.params.id;
    const currentUser = await User.findById(req.user._id);

    // Check if request exists
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

    // Add each other as friends
    currentUser.friends.push(friendId);
    friend.friends.push(currentUser._id);

    // Remove friend request
    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== friendId
    );

    await currentUser.save();
    await friend.save();

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
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
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing friend'
    });
  }
});

// _____________________________________________________________
// Delete Profile
// DELETE /api/users/profile
// _____________________________________________________________
router.delete('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile image if exists
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error('Error deleting profile image:', err);
        }
      }
    }

    // Delete user's projects
    await Project.deleteMany({ creator: userId });

    // Remove user from collaborators in other projects
    await Project.updateMany(
      { collaborators: userId },
      { $pull: { collaborators: userId } }
    );

    // Delete user's activities
    await Activity.deleteMany({ user: userId });

    // Delete user's discussions
    await Discussion.deleteMany({ user: userId });

    // Remove from friends lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId, friendRequests: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting profile'
    });
  }
});

module.exports = router;