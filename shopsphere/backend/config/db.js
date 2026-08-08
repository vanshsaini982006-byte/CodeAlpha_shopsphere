const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);
const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the connection string in .env (MONGO_URI).
 * Exits the process if the connection fails, since the API cannot function
 * without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
