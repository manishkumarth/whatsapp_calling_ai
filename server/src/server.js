const app = require('./app');
const config = require('./config/config');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
  const fs = require('fs');
  const path = require('path');
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

const start = async () => {
  await connectDB();
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
  });
};

if (!isServerless) {
  start().catch((err) => {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  });
}

module.exports = app;
