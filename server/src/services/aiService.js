const config = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');

exports.generateResponse = async (conversationHistory, customerMessage, agentConfig = {}) => {
  const systemPrompt = agentConfig.systemPrompt ||
    'You are a professional customer support agent. Be helpful, concise, and friendly. If you do not know an answer, say you will connect them to a human agent.';

  const defaultGreeting = agentConfig.greeting || 'Hello! How can I help you today?';

  if (!config.ai.apiKey) {
    logger.info('No AI API key configured, sending default reply');
    return {
      text: defaultGreeting,
      confidence: 0.5,
    };
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.direction === 'incoming' ? 'user' : 'assistant',
          content: msg.text,
        });
      }
    }

    messages.push({ role: 'user', content: customerMessage });

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || defaultGreeting;
    return { text: reply, confidence: 0.8 };
  } catch (error) {
    logger.error('AI response generation failed', { error: error.message });
    return { text: defaultGreeting, confidence: 0.3 };
  }
};

exports.generateSummary = async (transcript) => {
  return { summary: '', intent: '', sentiment: 'neutral' };
};
