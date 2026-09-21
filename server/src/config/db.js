const mongoose = require('mongoose');
const config = require('./config');
const logger = require('../utils/logger');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(config.mongoUri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
