// _____________________________________________________________
// MARKS: MongoDB Database Connection Configuration
// This file handles the connection to our MongoDB Atlas databse
// _____________________________________________________________

const mongoose = require('mongoose');

// Function to conect to MongoDB
const connectDB = async () => {
  try {
    // Get the MongoDB connection string from enviroment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
  } catch (error) {
    // If connection fails, log the eror and exit the process
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;