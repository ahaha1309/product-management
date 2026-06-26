const User = require('../../models/user.model');

module.exports.index = async (req, res) => {
  try {
    const users = await User.find({ deleted: false }).sort({ createdAt: -1 });
    res.render('admin/pages/users/index', {
      title: 'Danh sách Khách Hàng',
      users: users
    });
  } catch (error) {
    res.redirect('back');
  }
};

module.exports.detail = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, deleted: false });
    res.render('admin/pages/users/detail', {
      title: 'Chi tiết Khách Hàng',
      user: user
    });
  } catch (error) {
    res.redirect('back');
  }
};
