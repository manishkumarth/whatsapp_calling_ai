const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    direction: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'template', 'reaction'],
      default: 'text',
    },
    text: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    whatsappMessageId: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed', 'pending'],
      default: 'pending',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

messageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
