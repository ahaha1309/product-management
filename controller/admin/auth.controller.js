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
const loginLimiter = require('../../helper/login-limiter');

module.exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  const accountExist = await account.findOne({
    email: email,
    deleted: false,
  });
  if (!accountExist) {
    const attempts = loginLimiter.incrementFailed(req);
    if (attempts === 4) {
      req.flash('error', 'Email hoặc mật khẩu không đúng! Nếu sai 1 lần nữa, bạn sẽ bị khóa đăng nhập 15 phút.');
    } else {
      req.flash('error', 'Email hoặc mật khẩu không đúng!');
    }
    return res.redirect('back');
  }
  const isMatch = await bcrypt.compare(password, accountExist.password);
  if (!isMatch) {
    const attempts = loginLimiter.incrementFailed(req);
    if (attempts === 4) {
      req.flash('error', 'Email hoặc mật khẩu không đúng! Nếu sai 1 lần nữa, bạn sẽ bị khóa đăng nhập 15 phút.');
    } else {
      req.flash('error', 'Email hoặc mật khẩu không đúng!');
    }
    return res.redirect('back');
  }
  if (accountExist.status == 'inactive') {
    loginLimiter.incrementFailed(req);
    req.flash('error', 'Tài khoản đã bị khóa!');
    return res.redirect('back');
  }

  // Login success - Reset the limit
  loginLimiter.reset(req);
  req.session.account = {
    id: accountExist._id,
    email: accountExist.email,
    role: accountExist.role,
  };
  const activityLogger = require('../../helper/activity-log');
  await activityLogger.log(req, 'LOGIN', 'ACCOUNT', accountExist._id, 'Đăng nhập vào hệ thống quản trị', accountExist._id);

  res.cookie('token', accountExist.token, {
    httpOnly: true, // bảo mật
    secure: false, // true nếu dùng HTTPS
    sameSite: 'lax',
  });
  res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
};
module.exports.logout = async (req, res) => {
  const accountId = req.session && req.session.account ? req.session.account.id : null;
  if (accountId) {
    const activityLogger = require('../../helper/activity-log');
    await activityLogger.log(req, 'LOGOUT', 'ACCOUNT', accountId, 'Đăng xuất khỏi hệ thống', accountId);
  }

  req.session.destroy();
  res.clearCookie('token');
  res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
};
