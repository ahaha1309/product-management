const roleModel=require('../../models/roles.model');
const account = require('../../models/account.model');
const bcrypt = require('bcrypt');
const systemConfig=require('../../config/system');
module.exports.index = async (req, res) => {
  res.render('admin/pages/my-account/index', {
    title: 'Thông tin cá nhân',
  });
};
module.exports.edit = async (req, res) => {
  res.render('admin/pages/my-account/edit', {
    title: 'Chỉnh sửa thông tin cá nhân',
  });
};
module.exports.editPatch = async (req, res) => {
  try{
  const id = res.locals.account.id;
  const accountInit=await account.findOne({ _id: id, deleted: false });
  const fullname = req.body.fullname;
  const email = req.body.email;
  const existingAccount = await account.findOne({ email: email, deleted: false, _id: { $ne: id } });    
  if (existingAccount) {
    req.flash('error', 'Email đã tồn tại, vui lòng sử dụng email khác!');
    return res.redirect('back');
  } 
  const password = req.body.password;
  const phone = req.body.phone;
  const roleId = req.body.roleId; 
  const status = req.body.status;
  const data = {
    fullname: fullname || accountInit.fullname,
    email: email || accountInit.email,
    phone:phone ,
    password: password ? await bcrypt.hash(password, 10) : accountInit.password,
    avatar: req.file ? req.body[req.file.fieldname] : accountInit.avatar,
    roleId: roleId || accountInit.roleId,
    status: status || accountInit.status
  };  
  await account.updateOne({ _id: id }, data);
  res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  req.flash('success', `Cập nhật tài khoản thành công!`);
  } catch (error) {
    console.log("Edit Account Error:", error);
    res.redirect(`${systemConfig.prefixAdmin}/accounts/edit/${id}`);
  }
};