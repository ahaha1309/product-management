const User = require('../../models/user.model');
const filterStatusHelper = require('../../helper/fillterButton');

module.exports.index = async (req, res) => {
  try {
    const query = { deleted: false };
    if (req.query.status) {
      query.status = req.query.status;
    }
    const filterStatus = filterStatusHelper(req.query);

    const users = await User.find(query).sort({ createdAt: -1 });
    res.render('admin/pages/users/index', {
      title: 'Danh sách Khách Hàng',
      users: users,
      filterStatus: filterStatus
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

module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.params.status;
    await User.updateOne({ _id: id }, { status: status });
    res.redirect('back');
  } catch (error) {
    res.redirect('back');
  }
};
