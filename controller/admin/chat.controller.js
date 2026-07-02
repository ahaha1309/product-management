const Chat = require('../../models/chat.model');
const User = require('../../models/user.model');

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
                            
    // Bổ sung khách ẩn danh vào danh sách hiển thị
    anonymousIds.forEach(id => {
      users.push({
        _id: id,
        fullName: 'Khách vãng lai (Chưa ĐN)',
        email: 'Ẩn danh',
        avatar: 'https://dummyimage.com/40x40/cbd5e1/ffffff'
      });
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
