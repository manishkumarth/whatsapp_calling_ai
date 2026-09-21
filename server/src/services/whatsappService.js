const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

const GRAPH_API_URL = 'https://graph.facebook.com/v25.0';

const getHeaders = () => ({
  Authorization: `Bearer ${config.meta.accessToken}`,
  'Content-Type': 'application/json',
});

exports.sendTextMessage = async (to, text) => {
  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${config.meta.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      { headers: getHeaders() }
    );
    logger.info(`Text message sent to ${to}`, { messageId: response.data.messages?.[0]?.id });
    return response.data;
  } catch (error) {
    logger.error(`Failed to send text message to ${to}`, { error: error.response?.data || error.message });
    throw error;
  }
};

exports.sendTemplateMessage = async (to, templateName, languageCode = 'en_US', components = []) => {
  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${config.meta.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          ...(components.length && { components }),
        },
      },
      { headers: getHeaders() }
    );
    logger.info(`Template message sent to ${to}`, { template: templateName, messageId: response.data.messages?.[0]?.id });
    return response.data;
  } catch (error) {
    logger.error(`Failed to send template to ${to}`, { error: error.response?.data || error.message });
    throw error;
  }
};

exports.getPhoneNumberStatus = async () => {
  try {
    const response = await axios.get(`${GRAPH_API_URL}/${config.meta.phoneNumberId}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to get phone number status', { error: error.response?.data || error.message });
    throw error;
  }
};

exports.processIncomingMessage = async (messageData) => {
  logger.info('Processing incoming WhatsApp message', { from: messageData.from, type: messageData.type });
  return messageData;
};
