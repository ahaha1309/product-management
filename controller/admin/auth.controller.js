const account = require('../../models/account.model');
const bcrypt = require('bcrypt');
const systemConfig = require('../../config/system');
module.exports.getLogin = (req, res) => {
  if (req.cookies.token) {
    return res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
  res.render('admin/pages/auth/login', {
    title: 'Đăng nhập Admin',
    messages: req.flash(),
  });
};
module.exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  const accountExist = await account.findOne({
    email: email,
    deleted: false,
  });
  if (!accountExist) {
    req.flash('error', 'Email hoặc mật khẩu không đúng!');
    return res.redirect('back');
  }
  const isMatch = await bcrypt.compare(password, accountExist.password);
  if (!isMatch) {
    req.flash('error', 'Email hoặc mật khẩu không đúng!');
    return res.redirect('back');
  }
  if (accountExist.status == 'inactive') {
    req.flash('error', 'Tài khoản đã bị khóa!');
    return res.redirect('back');
  }
  req.session.account = {
    id: accountExist._id,
    email: accountExist.email,
    role: accountExist.role,
  };
  res.cookie('token', accountExist.token, {
    httpOnly: true, // bảo mật
    secure: false, // true nếu dùng HTTPS
    sameSite: 'lax',
  });
  res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
};
module.exports.logout = (req, res) => {
  req.session.destroy();
  res.clearCookie('token');
  res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
};
