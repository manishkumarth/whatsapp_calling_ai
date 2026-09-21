const Contact = require('../models/Contact');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.getStats = async (req, res, next) => {
  try {
    const userId = req.userId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    logger.info('Dashboard stats requested', { userId: userId.toString() });

    const [
      totalContacts,
      activeConversations,
      todayConversations,
      totalMessagesSent,
      totalMessagesReceived,
      todayMessagesSent,
      todayMessagesReceived,
      recentConversations,
      recentMessages,
    ] = await Promise.all([
      Contact.countDocuments({ userId }),
      Conversation.countDocuments({ userId, status: 'active' }),
      Conversation.countDocuments({ userId, createdAt: { $gte: todayStart } }),
      Message.countDocuments({ userId, direction: 'outgoing' }),
      Message.countDocuments({ userId, direction: 'incoming' }),
      Message.countDocuments({ userId, direction: 'outgoing', createdAt: { $gte: todayStart } }),
      Message.countDocuments({ userId, direction: 'incoming', createdAt: { $gte: todayStart } }),
      Conversation.find({ userId })
        .sort({ lastMessageAt: -1 })
        .limit(5)
        .populate('contactId', 'name phoneNumber'),
      Message.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('conversationId', 'phoneNumber'),
    ]);

    const messagesByDay = await Message.aggregate([
      { $match: { userId: req.userId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] } },
          received: { $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    logger.info('Dashboard stats computed', {
      totalContacts,
      activeConversations,
      totalMessagesSent,
      totalMessagesReceived,
    });

    return ApiResponse.success(res, {
      data: {
        totalContacts,
        activeConversations,
        todayConversations,
        totalMessagesSent,
        totalMessagesReceived,
        todayMessagesSent,
        todayMessagesReceived,
        recentConversations,
        recentMessages,
        messagesByDay,
      },
    });
  } catch (error) {
    next(error);
  }
};
