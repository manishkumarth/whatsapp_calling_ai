const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ApiResponse = require('../utils/apiResponse');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

exports.getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { userId: req.userId };
    if (status) query.status = status;

    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('contactId', 'name phoneNumber');

    return ApiResponse.paginated(res, { data: conversations, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId })
      .populate('contactId', 'name phoneNumber email');
    if (!conversation) {
      return ApiResponse.error(res, { message: 'Conversation not found', statusCode: 404 });
    }
    return ApiResponse.success(res, { data: conversation });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const query = { conversationId: req.params.id, userId: req.userId };

    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, { data: messages.reverse(), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
    if (!conversation) {
      return ApiResponse.error(res, { message: 'Conversation not found', statusCode: 404 });
    }

    // Try to send via WhatsApp API
    let whatsappMessageId = null;
    let status = 'pending';
    try {
      const result = await whatsappService.sendTextMessage(conversation.phoneNumber, text);
      whatsappMessageId = result.messages?.[0]?.id;
      status = 'sent';
      logger.info('Message sent via WhatsApp', { to: conversation.phoneNumber, whatsappMessageId });
    } catch (whatsappError) {
      logger.error('WhatsApp send failed, storing locally', { error: whatsappError.message });
      status = 'failed';
    }

    const message = await Message.create({
      conversationId: conversation._id,
      contactId: conversation.contactId,
      userId: req.userId,
      direction: 'outgoing',
      messageType: 'text',
      text,
      whatsappMessageId,
      status,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    return ApiResponse.success(res, { message: 'Message sent', data: message, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

exports.toggleAI = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
    if (!conversation) {
      return ApiResponse.error(res, { message: 'Conversation not found', statusCode: 404 });
    }
    conversation.aiEnabled = !conversation.aiEnabled;
    await conversation.save();
    return ApiResponse.success(res, { message: `AI ${conversation.aiEnabled ? 'enabled' : 'disabled'}`, data: conversation });
  } catch (error) {
    next(error);
  }
};
