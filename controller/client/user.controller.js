const userModel = require('../../models/user.model');
module.exports.index = async (req, res) => {
  const id = req.params.id;
  const user = await userModel.findOne({ _id: id }).select('-password -confirmPassword -token');
  res.render('client/pages/account/index', {
    title: 'Trang cá nhân',
    user: user,
  });
};
module.exports.editGet = async (req, res) => {
  const id = req.params.id;
  const user = await userModel.findOne({ _id: id }).select('-password -confirmPassword -token');
  res.render('client/pages/account/edit', {
    title: 'Chỉnh sửa trang cá nhân',
    user: user,
  });
};
module.exports.editPost = async (req, res) => {
  const id = req.params.id;
  const { fullName, email, address, phone } = req.body;

  const updateData = {};

  if (req.file) updateData.avatar = req.file.path;
  if (fullName !== undefined) updateData.fullName = fullName;
  if (email !== undefined) updateData.email = email;
  if (address !== undefined) updateData.address = address;
  if (phone !== undefined) updateData.phone = phone;

  await userModel.updateOne({ _id: id }, updateData);
  res.redirect(`/my-account/${id}`);
};
