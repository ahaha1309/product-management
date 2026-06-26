const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: null // null = công khai cho tất cả
  },
  type: {
    type: String,
    enum: ['order', 'review', 'product', 'promotion', 'system', 'restock'],
    required: true
  },
  title: String,
  message: String,
  icon: String, // emoji hoặc icon path
  link: String, // đường dẫn cần navigate
  data: mongoose.Schema.Types.Mixed, // Dữ liệu bổ sung
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  deleted: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
});

// TTL Index: Tự động xóa notification sau 30 ngày
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Notification = mongoose.model('Notification', notificationSchema, 'notifications');
module.exports = Notification;
