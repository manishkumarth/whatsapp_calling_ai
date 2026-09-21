const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(morgan('combined'));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/webhooks', webhookRoutes);

app.use(rateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const auth = require('./middleware/auth');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

app.get('/api/debug/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('conversationId', 'phoneNumber');
    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ lastMessageAt: -1 })
      .limit(10);
    res.json({
      messageCount: await Message.countDocuments({ userId: req.userId }),
      conversationCount: await Conversation.countDocuments({ userId: req.userId }),
      recentMessages: messages,
      recentConversations: conversations,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.use(errorHandler);

module.exports = app;
