const logger = require('../utils/logger');

exports.initiateCall = async (phoneNumber, options = {}) => {
  logger.info('Voice call initiation - stub (Phase 4)');
  return { callId: null, status: 'not_configured' };
};

exports.endCall = async (callId) => {
  logger.info('Voice call end - stub (Phase 4)');
  return { status: 'not_configured' };
};

exports.handleAudioStream = async (stream) => {
  logger.info('Audio stream handling - stub (Phase 4)');
  return null;
};
