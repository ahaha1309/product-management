const userModel = require('../../models/user.model');
const otpModel = require('../../models/otp.model');
const bcrypt = require('bcrypt');
const sendEmail = require('../../helper/sendEmail');
const sendSms = require('../../helper/sendSms');
const generateHelper = require('../../helper/generate');

module.exports.loginGet = (req, res) => {
  res.render('client/pages/auth/login');
};

module.exports.registerGet = (req, res) => {
  res.render('client/pages/auth/register');
};

const loginLimiter = require('../../helper/login-limiter');

module.exports.loginPost = async (req, res) => {
  const { email, password } = req.body;
  const userExist = await userModel.findOne({
    email: email,
    deleted: false,
  });
  if (!userExist) {
    const attempts = loginLimiter.incrementFailed(req);
    if (attempts === 4) {
      req.flash('error', 'Email hoặc mật khẩu không đúng! Nếu sai 1 lần nữa, bạn sẽ bị khóa đăng nhập 15 phút.');
    } else {
      req.flash('error', 'Email hoặc mật khẩu không đúng!');
    }
    return res.redirect('back');
  }
  const isMatch = await bcrypt.compare(password, userExist.password);
  if (!isMatch) {
    const attempts = loginLimiter.incrementFailed(req);
    if (attempts === 4) {
      req.flash('error', 'Email hoặc mật khẩu không đúng! Nếu sai 1 lần nữa, bạn sẽ bị khóa đăng nhập 15 phút.');
    } else {
      req.flash('error', 'Email hoặc mật khẩu không đúng!');
    }
    return res.redirect('back');
  }
  if (userExist.status == 'inactive') {
    loginLimiter.incrementFailed(req);
    req.flash('error', 'Tài khoản đã bị khóa!');
    return res.redirect('back');
  }
  if (userExist.status == 'unverified') {
    loginLimiter.incrementFailed(req);
    req.flash('error', 'Tài khoản chưa được xác thực!');
    return res.redirect('back');
  }
  
  // Login success - Reset the limit
  loginLimiter.reset(req);

  req.session.account = {
    id: userExist._id,
    email: userExist.email,
    fullName: userExist.fullName,
    role: userExist.role,
  };
  const redirectUrl = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.cookie('token', userExist.token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });
  res.redirect(redirectUrl);
};

module.exports.registerPost = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;
  const userExist = await userModel.findOne({
    email: email,
    deleted: false,
  });
  if (userExist && userExist.status === 'active') {
    req.flash('error', 'Email đã tồn tại');
    return res.redirect('back');
  }
  if (password.length < 8) {
    req.flash('error', 'Mật khẩu phải có độ dài hơn 8 ký tự');
    return res.redirect('back');
  }
  if (password != confirmPassword) {
    req.flash('error', 'Mật khẩu nhập lại không khớp');
    return res.redirect('back');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Store pending user in session
  req.session.pendingUser = {
    fullName: fullName,
    email: email,
    password: passwordHash
  };

  // Generate OTP
  const otpCode = generateHelper.generateRandomNumber(6);
  await otpModel.create({
    email: email,
    otp: otpCode,
    action: 'register'
  });

  // Send OTP Email
  await sendEmail.sendOTPEmail(email, otpCode, 'register');

  req.flash('success', 'Mã OTP đã được gửi đến email của bạn!');
  res.redirect(`/auth/verify-otp?email=${email}&action=register`);
};

module.exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    res.redirect(`/`);
  });
};

// ==========================================
// OTP VERIFICATION
// ==========================================
module.exports.verifyOtpGet = (req, res) => {
  const email = req.query.email;
  const phone = req.query.phone;
  const action = req.query.action;
  res.render('client/pages/auth/verify-otp', { email, phone, action });
};

module.exports.verifyOtpPost = async (req, res) => {
  const { email, phone, otp, action } = req.body;
  const query = { otp: otp, action: action };
  if (email) query.email = email;
  if (phone) query.phone = phone;

  const validOtp = await otpModel.findOne(query);

  if (!validOtp) {
    req.flash('error', 'Mã OTP không hợp lệ hoặc đã hết hạn!');
    let redirectUrl = `/auth/verify-otp?action=${action}`;
    if (email) redirectUrl += `&email=${email}`;
    if (phone) redirectUrl += `&phone=${phone}`;
    return res.redirect(redirectUrl);
  }

  // Handle register success
  if (action === 'register') {
    const pendingUser = req.session.pendingUser;
    if (!pendingUser) {
      req.flash('error', 'Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.');
      return res.redirect('/auth/register');
    }
    
    // Check if user exist again (might be unverified from previous attempts)
    const existingUser = await userModel.findOne({ email: pendingUser.email, deleted: false });
    if (existingUser) {
        existingUser.fullName = pendingUser.fullName;
        existingUser.password = pendingUser.password;
        existingUser.status = 'active';
        await existingUser.save();
    } else {
        await userModel.create({
            fullName: pendingUser.fullName,
            email: pendingUser.email,
            password: pendingUser.password,
            status: 'active'
        });
    }

    delete req.session.pendingUser;
    await otpModel.deleteOne({ _id: validOtp._id });
    req.flash('success', 'Đăng ký tài khoản thành công!');
    return res.redirect('/auth/login');
  }

  // Handle forgotPassword success
  if (action === 'forgotPassword') {
    // Store verified status in session to allow reset
    req.session.resetPasswordVerified = true;
    req.session.resetPasswordEmail = email;
    req.session.resetPasswordPhone = phone;
    await otpModel.deleteOne({ _id: validOtp._id });
    return res.redirect('/auth/reset-password');
  }

  res.redirect('/');
};

// ==========================================
// FORGOT PASSWORD
// ==========================================
module.exports.forgotPasswordGet = (req, res) => {
  res.render('client/pages/auth/forgot-password');
};

module.exports.forgotPasswordPost = async (req, res) => {
  const { method, email, phone } = req.body;
  
  const otpCode = generateHelper.generateRandomNumber(6);

  if (method === 'email') {
    const userExist = await userModel.findOne({ email: email, deleted: false, status: 'active' });
    if (!userExist) {
      req.flash('error', 'Email không tồn tại trong hệ thống!');
      return res.redirect('back');
    }
    await otpModel.create({ email: email, otp: otpCode, action: 'forgotPassword' });
    await sendEmail.sendOTPEmail(email, otpCode, 'forgotPassword');
    req.flash('success', 'Mã xác thực đã được gửi đến email!');
    return res.redirect(`/auth/verify-otp?email=${email}&action=forgotPassword`);
  } else if (method === 'phone') {
    const userExist = await userModel.findOne({ phone: phone, deleted: false, status: 'active' });
    if (!userExist) {
      req.flash('error', 'Số điện thoại không tồn tại trong hệ thống!');
      return res.redirect('back');
    }
    await otpModel.create({ phone: phone, otp: otpCode, action: 'forgotPassword' });
    await sendSms.sendOTPPhone(phone, otpCode, 'forgotPassword');
    req.flash('success', 'Mã xác thực đã được gửi đến số điện thoại!');
    return res.redirect(`/auth/verify-otp?phone=${phone}&action=forgotPassword`);
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================
module.exports.resetPasswordGet = (req, res) => {
  if (!req.session.resetPasswordVerified) {
    req.flash('error', 'Vui lòng xác thực trước khi đổi mật khẩu!');
    return res.redirect('/auth/forgot-password');
  }
  res.render('client/pages/auth/reset-password');
};

module.exports.resetPasswordPost = async (req, res) => {
  if (!req.session.resetPasswordVerified) {
    req.flash('error', 'Yêu cầu không hợp lệ!');
    return res.redirect('/auth/forgot-password');
  }

  const { password, confirmPassword } = req.body;
  if (password.length < 8) {
    req.flash('error', 'Mật khẩu phải có độ dài hơn 8 ký tự!');
    return res.redirect('back');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Mật khẩu nhập lại không khớp!');
    return res.redirect('back');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  const email = req.session.resetPasswordEmail;
  const phone = req.session.resetPasswordPhone;
  
  const query = { deleted: false, status: 'active' };
  if (email) query.email = email;
  if (phone) query.phone = phone;

  await userModel.updateOne(query, { password: passwordHash });

  delete req.session.resetPasswordVerified;
  delete req.session.resetPasswordEmail;
  delete req.session.resetPasswordPhone;

  req.flash('success', 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
  res.redirect('/auth/login');
};

// ==========================================
// RESEND OTP
// ==========================================
module.exports.resendOtpPost = async (req, res) => {
  const { email, phone, action } = req.body;
  
  if (!email && !phone) {
    req.flash('error', 'Không tìm thấy thông tin liên hệ!');
    return res.redirect('back');
  }

  const otpCode = generateHelper.generateRandomNumber(6);
  
  if (email) {
    await otpModel.deleteMany({ email: email, action: action });
    await otpModel.create({ email: email, otp: otpCode, action: action });
    await sendEmail.sendOTPEmail(email, otpCode, action);
    req.flash('success', 'Mã OTP mới đã được gửi đến email của bạn!');
    return res.redirect(`/auth/verify-otp?email=${email}&action=${action}`);
  } else if (phone) {
    await otpModel.deleteMany({ phone: phone, action: action });
    await otpModel.create({ phone: phone, otp: otpCode, action: action });
    await sendSms.sendOTPPhone(phone, otpCode, action);
    req.flash('success', 'Mã OTP mới đã được gửi đến số điện thoại của bạn!');
    return res.redirect(`/auth/verify-otp?phone=${phone}&action=${action}`);
  }
};
