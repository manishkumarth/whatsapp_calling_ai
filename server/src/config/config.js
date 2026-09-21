const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-ai-agent',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN || '',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
    wabaId: process.env.META_WABA_ID || '',
    verifyToken: process.env.META_VERIFY_TOKEN || '',
    appSecret: process.env.META_APP_SECRET || '',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
  },
  voice: {
    providerApiKey: process.env.VOICE_PROVIDER_API_KEY || '',
  },
};

module.exports = config;
