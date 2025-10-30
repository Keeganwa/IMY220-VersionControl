const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const projectFilesDir = path.join(uploadDir, 'projects');
const projectImagesDir = path.join(uploadDir, 'images');

if (!fs.existsSync(projectFilesDir)) {
  fs.mkdirSync(projectFilesDir, { recursive: true });
}

if (!fs.existsSync(projectImagesDir)) {
  fs.mkdirSync(projectImagesDir, { recursive: true });
}

// _____________________________________________________________
// Storage Configuration for Project Files
// _____________________________________________________________
const projectFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// _____________________________________________________________
// Storage Configuration for Project Images
// _____________________________________________________________
const projectImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// _____________________________________________________________
// File Filter for Images (5MB limit)
// _____________________________________________________________
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// _____________________________________________________________
// Multer Upload Configurations
// _____________________________________________________________

// For project files (multiple files, any type, unlimited count)
const uploadProjectFiles = multer({
  storage: projectFileStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB per file
  }
}).array('files'); // No limit on count

// For project images (single image, 5MB max)
const uploadProjectImage = multer({
  storage: projectImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFileFilter
}).single('image');

// _____________________________________________________________
// Error Handler Middleware
// _____________________________________________________________
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB for images and 50MB for project files.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  
  next();
};

module.exports = {
  uploadProjectFiles,
  uploadProjectImage,
  handleMulterError,
  projectFilesDir,
  projectImagesDir
};