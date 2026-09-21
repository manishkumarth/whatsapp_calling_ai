const whatsappService = require('../services/whatsappService');
const Conversation = require('../models/Conversation');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const ApiResponse = require('../utils/apiResponse');
const { toE164, isValidPhone } = require('../utils/phoneValidator');
const logger = require('../utils/logger');

exports.sendMessage = async (req, res, next) => {
  try {
    const { to, text } = req.body;
    const normalizedPhone = toE164(to);
    if (!isValidPhone(normalizedPhone)) {
      return ApiResponse.error(res, { message: 'Invalid phone number', statusCode: 400 });
    }

    logger.info('Sending WhatsApp message', { to: normalizedPhone, userId: req.userId.toString() });

    const result = await whatsappService.sendTextMessage(normalizedPhone, text);

    // Find or create contact
    let contact = await Contact.findOne({ userId: req.userId, phoneNumber: normalizedPhone });
    if (!contact) {
      contact = await Contact.create({
        userId: req.userId,
        name: normalizedPhone,
        phoneNumber: normalizedPhone,
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ userId: req.userId, phoneNumber: normalizedPhone });
    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.userId,
        contactId: contact._id,
        phoneNumber: normalizedPhone,
        channel: 'whatsapp',
      });
    }

    // Store outgoing message
    const message = await Message.create({
      conversationId: conversation._id,
      contactId: contact._id,
      userId: req.userId,
      direction: 'outgoing',
      messageType: 'text',
      text,
      whatsappMessageId: result.messages?.[0]?.id,
      status: 'sent',
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    logger.info('Outgoing message stored', { messageId: message._id, whatsappId: result.messages?.[0]?.id });

    return ApiResponse.success(res, { message: 'Message sent', data: { message, whatsappResponse: result } });
  } catch (error) {
    logger.error('Failed to send message', { error: error.message });
    next(error);
  }
};

exports.sendTemplate = async (req, res, next) => {
  try {
    const { to, templateName, languageCode, components } = req.body;
    const normalizedPhone = toE164(to);
    if (!isValidPhone(normalizedPhone)) {
      return ApiResponse.error(res, { message: 'Invalid phone number', statusCode: 400 });
    }

    const result = await whatsappService.sendTemplateMessage(normalizedPhone, templateName, languageCode, components);

    // Find or create conversation
    let conversation = await Conversation.findOne({ userId: req.userId, phoneNumber: normalizedPhone });
    if (!conversation) {
      let contact = await Contact.findOne({ userId: req.userId, phoneNumber: normalizedPhone });
      if (!contact) {
        contact = await Contact.create({
          userId: req.userId,
          name: normalizedPhone,
          phoneNumber: normalizedPhone,
        });
      }
      conversation = await Conversation.create({
        userId: req.userId,
        contactId: contact._id,
        phoneNumber: normalizedPhone,
        channel: 'whatsapp',
      });
    }

    // Store template message
    await Message.create({
      conversationId: conversation._id,
      contactId: conversation.contactId,
      userId: req.userId,
      direction: 'outgoing',
      messageType: 'template',
      text: `Template: ${templateName}`,
      whatsappMessageId: result.messages?.[0]?.id,
      status: 'sent',
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    return ApiResponse.success(res, { message: 'Template sent', data: result });
  } catch (error) {
    logger.error('Failed to send template', { error: error.message });
    next(error);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const status = await whatsappService.getPhoneNumberStatus();
    return ApiResponse.success(res, { data: status });
  } catch (error) {
    return ApiResponse.success(res, {
      data: { status: 'not_configured', message: 'WhatsApp not configured or credentials missing' },
    });
  }
};
