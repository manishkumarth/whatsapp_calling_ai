const app = require('./app');
const config = require('./config/config');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const start = async () => {
  await connectDB();
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
