const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, _next) => {
  logger.error(`${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.error(res, { message: 'Validation error', error: messages, statusCode: 400 });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, { message: `Duplicate value for ${field}`, statusCode: 409 });
  }

  if (err.name === 'CastError') {
    return ApiResponse.error(res, { message: 'Invalid ID format', statusCode: 400 });
  }

  return ApiResponse.error(res, {
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    statusCode: err.statusCode || 500,
  });
};

module.exports = errorHandler;
