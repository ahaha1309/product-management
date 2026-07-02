const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
    },
    targetType: {
      type: String,
      required: true,
      enum: ['PRODUCT', 'CATEGORY', 'ARTICLE', 'FLASH_SALE', 'VOUCHER', 'ORDER', 'PURCHASE_ORDER', 'SUPPLIER', 'ROLE', 'ACCOUNT', 'SYSTEM']
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    details: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');
module.exports = ActivityLog;
