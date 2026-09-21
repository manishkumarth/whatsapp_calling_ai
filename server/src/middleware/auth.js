const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return ApiResponse.error(res, { message: 'Authentication required', statusCode: 401 });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.error(res, { message: 'User not found', statusCode: 401 });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, { message: 'Invalid token', statusCode: 401 });
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, { message: 'Token expired', statusCode: 401 });
    }
    return ApiResponse.error(res, { message: 'Authentication failed', statusCode: 401 });
  }
};

module.exports = auth;
