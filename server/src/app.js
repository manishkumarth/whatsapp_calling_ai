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

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

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

const webhookStats = require('./webhooks/whatsappWebhook');
app.get('/api/debug/webhook-stats', (req, res) => {
  res.json(webhookStats.getStats());
});

app.get('/api/debug/db', async (req, res) => {
  try {
    const Message = require('./models/Message');
    const Conversation = require('./models/Conversation');
    const User = require('./models/User');
    const Contact = require('./models/Contact');
    res.json({
      users: await User.countDocuments(),
      conversations: await Conversation.countDocuments(),
      messages: await Message.countDocuments(),
      contacts: await Contact.countDocuments(),
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

const auth = require('./middleware/auth');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

app.get('/api/debug/all', auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const allConversations = await Conversation.countDocuments();
    const allMessages = await Message.countDocuments();
    const myConversations = await Conversation.countDocuments({ userId: req.userId });
    const myMessages = await Message.countDocuments({ userId: req.userId });
    const recentConversations = await Conversation.find().sort({ createdAt: -1 }).limit(5).populate('contactId', 'name phoneNumber');
    const recentMessages = await Message.find().sort({ createdAt: -1 }).limit(10);
    res.json({
      totalUsers,
      allConversations,
      allMessages,
      myConversations,
      myMessages,
      myUserId: req.userId.toString(),
      recentConversations,
      recentMessages,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.use(errorHandler);

module.exports = app;
