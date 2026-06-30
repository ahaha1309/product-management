const express = require('express');
const router = express.Router();
const Notification = require('../../models/notification.model');

// Lấy danh sách thông báo
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ isAdmin: true })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const unreadCount = await Notification.countDocuments({ isAdmin: true, read: false });

    res.json({
      code: 200,
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Lỗi server' });
  }
});

// Đánh dấu đã đọc
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ isAdmin: true, read: false }, { read: true, readAt: new Date() });
    res.json({ code: 200, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Lỗi server' });
  }
});

module.exports = router;
