const express = require('express');
const router = express.Router();
const Question = require('../../models/question.model');
const authMiddleware = require('../../middleware/client/auth.middleware');

// API gửi câu hỏi mới
router.post('/create', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { productId, content } = req.body;
    
    if (!content || !productId) {
      return res.status(400).json({ code: 400, message: 'Thiếu thông tin' });
    }

    const question = new Question({
      productId,
      userId: res.locals.user._id,
      content: content.trim()
    });

    await question.save();
    
    // Gửi thông báo cho Admin (tùy chọn)
    if (global._io) {
      global._io.emit('ADMIN_NEW_NOTIFICATION', {
        title: 'Câu hỏi mới',
        message: `Khách hàng ${res.locals.user.fullName} vừa đặt câu hỏi cho sản phẩm.`,
        link: `/admin/questions`, // Tính năng quản lý Q&A admin
        time: new Date()
      });
    }

    res.json({ code: 200, message: 'Gửi câu hỏi thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: 'Lỗi server' });
  }
});

// API gửi câu trả lời
router.post('/answer/:id', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    const questionId = req.params.id;

    if (!content) {
      return res.status(400).json({ code: 400, message: 'Nội dung không được rỗng' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ code: 404, message: 'Không tìm thấy câu hỏi' });
    }

    question.answers.push({
      userId: res.locals.user._id,
      isAdmin: false, // Default is false for client route
      content: content.trim()
    });

    await question.save();
    res.json({ code: 200, message: 'Đã gửi câu trả lời' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: 'Lỗi server' });
  }
});

module.exports = router;
