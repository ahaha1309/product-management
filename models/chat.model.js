const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User' }, // ID của khách hàng
    content: String,
    isAdmin: { type: Boolean, default: false }, // true nếu là admin gửi, false nếu là user gửi
    read: { type: Boolean, default: false }, // Trạng thái đã đọc
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model('Chat', chatSchema, 'chats');

module.exports = Chat;
