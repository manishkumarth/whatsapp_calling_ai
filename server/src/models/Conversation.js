const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'voice', 'sms'],
      default: 'whatsapp',
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'pending'],
      default: 'active',
    },
    assignedAgent: {
      type: String,
      default: null,
    },
    aiEnabled: {
      type: Boolean,
      default: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, status: 1 });
conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
