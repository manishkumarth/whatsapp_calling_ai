const config = require('./config');

const allowedOrigins = config.clientUrl
  ? config.clientUrl.split(',').map((url) => url.trim())
  : [];

const isProd = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isProd) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
