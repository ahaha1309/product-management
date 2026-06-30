const Chat = require('../../models/chat.model');
const User = require('../../models/user.model');

module.exports.index = async (req, res) => {
  try {
    // Lấy ra danh sách các userId đã từng chat
    const uniqueUserIds = await Chat.distinct('userId', { deleted: false });
    
    // Lấy thông tin user
    const users = await User.find({ _id: { $in: uniqueUserIds }, deleted: false }).select('fullName avatar email');
    
    // Có thể bổ sung lấy tin nhắn cuối cùng để hiển thị preview, nhưng làm đơn giản trước
    
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
