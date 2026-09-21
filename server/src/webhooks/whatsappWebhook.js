const config = require('../config/config');
const logger = require('../utils/logger');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const User = require('../models/User');
const aiService = require('../services/aiService');
const whatsappService = require('../services/whatsappService');

exports.verify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Webhook verification request', { mode, token: token ? '***' : null });

  if (mode === 'subscribe' && token === config.meta.verifyToken) {
    logger.info('Webhook verified successfully');
    return res.status(200).send(challenge);
  }
  logger.warn('Webhook verification failed', { mode, tokenMatch: token === config.meta.verifyToken });
  return res.sendStatus(403);
};

exports.handleEvent = async (req, res) => {
  try {
    const body = req.body;

    logger.info('Webhook event received', {
      object: body.object,
      entryCount: body.entry?.length,
      hasMessages: !!body.entry?.[0]?.changes?.[0]?.value?.messages,
      hasStatuses: !!body.entry?.[0]?.changes?.[0]?.value?.statuses,
    });

    if (body.object !== 'whatsapp_business_account') {
      logger.warn('Non-whatsapp_business_account webhook', { object: body.object });
      return res.sendStatus(404);
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    if (!changes) {
      logger.warn('No changes in webhook entry');
      return res.sendStatus(200);
    }

    const value = changes.value;
    const phoneNumberId = value.metadata?.phone_number_id;

    logger.info('Webhook metadata', { phoneNumberId, wabaId: entry?.id });

    if (value.messages) {
      for (const msg of value.messages) {
        logger.info('Processing incoming message', { from: msg.from, type: msg.type, id: msg.id });
        await handleIncomingMessage(msg, value.contacts, phoneNumberId);
      }
    }

    if (value.statuses) {
      for (const status of value.statuses) {
        logger.info('Processing status update', { id: status.id, status: status.status });
        await handleStatusUpdate(status);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    logger.error('Webhook processing error', { error: error.message, stack: error.stack });
    return res.sendStatus(200);
  }
};

async function handleIncomingMessage(msg, contacts, phoneNumberId) {
  try {
    const from = msg.from;
    const contactData = contacts?.[0];
    const waId = contactData?.wa_id;
    const contactName = contactData?.profile?.name;

    // Find user who owns this phone_number_id
    let user = null;
    if (phoneNumberId) {
      user = await User.findOne({ phoneNumberId });
      // Fallback: if no user linked by phoneNumberId, find first user and link it
      if (!user) {
        user = await User.findOne();
        if (user && phoneNumberId) {
          user.phoneNumberId = phoneNumberId;
          await user.save();
          logger.info('Auto-linked phoneNumberId to user', { userId: user._id.toString(), phoneNumberId });
        }
      }
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      logger.warn('No user found for incoming message', { from, phoneNumberId });
      return;
    }

    // Find or create contact
    let contact = null;
    if (waId) {
      contact = await Contact.findOne({ userId: user._id, phoneNumber: `+${waId}` });
      if (!contact && contactName) {
        contact = await Contact.create({
          userId: user._id,
          name: contactName,
          phoneNumber: `+${waId}`,
        });
        logger.info('Auto-created contact from webhook', { name: contactName, phone: waId });
      }
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ userId: user._id, phoneNumber: from });
    if (!conversation) {
      conversation = await Conversation.create({
        userId: user._id,
        contactId: contact?._id,
        phoneNumber: from,
        channel: 'whatsapp',
        metadata: { phoneNumberId },
      });
      logger.info('Created new conversation', { from, userId: user._id });
    }

    // Parse message content
    let textContent = '';
    let messageType = msg.type;
    if (msg.type === 'text') {
      textContent = msg.text?.body || '';
    } else if (msg.type === 'image') {
      textContent = msg.image?.caption || '[Image]';
    } else if (msg.type === 'audio') {
      textContent = '[Audio message]';
    } else if (msg.type === 'video') {
      textContent = msg.video?.caption || '[Video]';
    } else if (msg.type === 'document') {
      textContent = msg.document?.caption || '[Document]';
    } else if (msg.type === 'interactive') {
      textContent = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive]';
    }

    await Message.create({
      conversationId: conversation._id,
      contactId: contact?._id,
      userId: user._id,
      direction: 'incoming',
      messageType,
      text: textContent,
      whatsappMessageId: msg.id,
      status: 'delivered',
      timestamp: new Date(parseInt(msg.timestamp) * 1000),
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    logger.info('Incoming message stored successfully', { from, messageId: msg.id, userId: user._id, text: textContent.substring(0, 50) });

    // Auto-reply if AI is enabled on this conversation
    if (conversation.aiEnabled && msg.type === 'text') {
      try {
        const recentMessages = await Message.find({ conversationId: conversation._id })
          .sort({ timestamp: -1 })
          .limit(10)
          .lean();

        const history = recentMessages.reverse();
        const aiReply = await aiService.generateResponse(history, textContent, {});

        await whatsappService.sendTextMessage(from, aiReply.text);

        await Message.create({
          conversationId: conversation._id,
          contactId: contact?._id,
          userId: user._id,
          direction: 'outgoing',
          messageType: 'text',
          text: aiReply.text,
          status: 'sent',
        });

        conversation.lastMessageAt = new Date();
        await conversation.save();

        logger.info('Auto-reply sent', { to: from, reply: aiReply.text.substring(0, 50) });
      } catch (replyError) {
        logger.error('Auto-reply failed', { error: replyError.message });
      }
    }
  } catch (error) {
    logger.error('Error handling incoming message', { error: error.message, stack: error.stack });
  }
}

async function handleStatusUpdate(status) {
  try {
    const message = await Message.findOne({ whatsappMessageId: status.id });
    if (message) {
      message.status = status.status;
      await message.save();
      logger.info('Message status updated', { messageId: status.id, status: status.status });
    } else {
      logger.warn('Message not found for status update', { whatsappMessageId: status.id });
    }
  } catch (error) {
    logger.error('Error handling status update', { error: error.message });
  }
}
