const Chat = require('../../models/chat.model');

module.exports.history = async (req, res) => {
  try {
    const userId = res.locals.user ? res.locals.user._id.toString() : null;
    if (!userId) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }
    const history = await Chat.find({ userId: userId, deleted: false }).sort({ createdAt: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy lịch sử" });
  }
};

module.exports.send = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = res.locals.user ? res.locals.user._id.toString() : null;
    if (!userId || !content) {
      return res.status(400).json({ error: "Thiếu dữ liệu" });
    }
    const chat = new Chat({
      userId: userId,
      content: content,
      isAdmin: false
    });
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Lỗi gửi tin nhắn" });
  }
};
