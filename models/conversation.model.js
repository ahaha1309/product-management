const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  performedBy: { type: String, required: true },
  reason: { type: String }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Ensure 1 active conversation state per user
  status: { type: String, enum: ['BOT', 'HUMAN', 'CLOSED'], default: 'BOT' },
  assignedAgentId: { type: String, ref: 'Account', default: null },
  transferredBy: { type: String, enum: ['SYSTEM', 'ADMIN', null], default: null },
  transferReason: { type: String, enum: ['HUMAN_REQUEST', 'LOW_CONFIDENCE', 'FALLBACK', 'COMPLAINT', 'REFUND', 'PAYMENT', 'MANUAL', 'OTHER', null], default: null },
  resumedAt: { type: Date },
  closedAt: { type: Date },
  auditLogs: [auditLogSchema]
}, {
  timestamps: true
});

const Conversation = mongoose.model('Conversation', conversationSchema, 'conversations');

module.exports = Conversation;
