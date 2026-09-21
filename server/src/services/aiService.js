const logger = require('../utils/logger');

exports.generateResponse = async (conversationHistory, customerMessage, agentConfig = {}) => {
  logger.info('AI response generation - stub (Phase 3)');
  return {
    text: 'Thank you for your message. An agent will be with you shortly.',
    confidence: 0.5,
  };
};

exports.generateSummary = async (transcript) => {
  logger.info('AI summary generation - stub (Phase 3)');
  return { summary: '', intent: '', sentiment: 'neutral' };
};
