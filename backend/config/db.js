

const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    
    const conn = await mongoose.connect("mongodb+srv://keeganwalker629_db_user:codeword@codebase.3uzzb0w.mongodb.net/?retryWrites=true&w=majority&appName=codebase");

    console.log(`MongoDB Conected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
  } catch (error) {
    //connection fails
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
//-------------------------------------------------------------