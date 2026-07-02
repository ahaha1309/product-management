const Chat = require('../../models/chat.model');
const User = require('../../models/user.model');
const Conversation = require('../../models/conversation.model');

const mongoose = require('mongoose');

module.exports.index = async (req, res) => {
  try {
    // Lấy ra danh sách các userId đã từng chat
    const uniqueUserIds = await Chat.distinct('userId', { deleted: false });
    
    // Tách riêng ID hợp lệ (user đăng nhập) và ID dạng chuỗi (khách ẩn danh)
    const validUserIds = uniqueUserIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const anonymousIds = uniqueUserIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    
    // Lấy thông tin user đã đăng ký
    const users = await User.find({ _id: { $in: validUserIds }, deleted: false })
                            .select('fullName avatar email')
                            .lean();
    // Lấy trạng thái cuộc trò chuyện cho từng user
    const conversations = await Conversation.find({ userId: { $in: uniqueUserIds } }).lean();
    const conversationMap = {};
    conversations.forEach(c => { conversationMap[c.userId] = c; });

    // Bổ sung khách ẩn danh vào danh sách hiển thị
    anonymousIds.forEach(id => {
      users.push({
        _id: id,
        fullName: 'Khách vãng lai (Chưa ĐN)',
        email: 'Ẩn danh',
        avatar: 'https://dummyimage.com/40x40/cbd5e1/ffffff'
      });
    });

    // Merge status vào users
    users.forEach(u => {
      const c = conversationMap[u._id.toString()];
      u.status = c ? c.status : 'BOT';
      u.assignedAgentId = c ? c.assignedAgentId : null;
    });

    res.render('admin/pages/chat/index', {
      title: 'Hỗ trợ khách hàng',
      pageTitle: 'Quản lý hỗ trợ trực tuyến',
      chatUsers: users
    });
  } catch (error) {
    console.log(error);
    req.flash('error', 'Lỗi lấy danh sách chat!');
    res.redirect('back');
  }
};

module.exports.history = async (req, res) => {
  try {
    const userId = req.params.userId;
    const history = await Chat.find({ userId: userId, deleted: false }).sort({ createdAt: 1 });
    const conversation = await Conversation.findOne({ userId: userId }).lean();
    
    res.json({
      history: history,
      conversation: conversation || { status: 'BOT', assignedAgentId: null }
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy lịch sử" });
  }
};

module.exports.send = async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ error: "Thiếu dữ liệu" });
    }

    const conversation = await Conversation.findOne({ userId });
    const adminId = res.locals.user ? res.locals.user.id : null;
    
    if (!conversation || conversation.status !== 'HUMAN' || conversation.assignedAgentId !== adminId) {
      return res.status(403).json({ error: "Forbidden: You do not own this conversation." });
    }

    const chat = new Chat({
      userId: userId,
      content: content,
      isAdmin: true
    });
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Lỗi gửi tin nhắn" });
  }
};

module.exports.take = async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminId = res.locals.user ? res.locals.user.id : 'unknown_admin';

    const conversation = await Conversation.findOneAndUpdate(
      { userId: userId, assignedAgentId: null },
      { 
        $set: { 
          status: 'HUMAN', 
          assignedAgentId: adminId, 
          transferredBy: 'ADMIN', 
          transferReason: 'MANUAL' 
        },
        $push: {
          auditLogs: { action: 'ASSIGNED', performedBy: adminId, reason: 'MANUAL' }
        }
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(409).json({ error: "Conflict: Conversation has already been assigned." });
    }

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: "Lỗi tiếp nhận chat" });
  }
};

module.exports.returnBot = async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminId = res.locals.user ? res.locals.user.id : 'unknown_admin';

    const conversation = await Conversation.findOne({ userId });
    if (!conversation || conversation.assignedAgentId !== adminId) {
      return res.status(403).json({ error: "Forbidden: You do not own this conversation." });
    }

    conversation.status = 'BOT';
    conversation.assignedAgentId = null;
    conversation.transferredBy = null;
    conversation.transferReason = null;
    conversation.resumedAt = new Date();
    conversation.auditLogs.push({ action: 'RETURNED', performedBy: adminId });
    await conversation.save();

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: "Lỗi trả về bot" });
  }
};

module.exports.closeConversation = async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminId = res.locals.user ? res.locals.user.id : 'unknown_admin';

    const conversation = await Conversation.findOne({ userId });
    if (!conversation || conversation.assignedAgentId !== adminId) {
      return res.status(403).json({ error: "Forbidden: You do not own this conversation." });
    }

    conversation.status = 'CLOSED';
    conversation.assignedAgentId = null;
    conversation.closedAt = new Date();
    conversation.auditLogs.push({ action: 'CLOSED', performedBy: adminId });
    await conversation.save();

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: "Lỗi đóng chat" });
  }
};
