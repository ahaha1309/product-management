const userModel=require('../../models/user.model')
const bcrypt=require('bcrypt')
module.exports.loginGet=(req,res)=>{
    res.render('client/pages/auth/login')
}
module.exports.registerGet=(req,res)=>{
    res.render('client/pages/auth/register')
}
module.exports.loginPost=async (req,res)=>{
  const { email, password } = req.body;
  const userExist = await userModel.findOne({
    email: email,
    deleted: false,
  });
  if (!userExist) {
    req.flash('error', 'Email hoặc mật khẩu không đúng!');
    return res.redirect('back');
  }
  const isMatch = await bcrypt.compare(password, userExist.password);
  if (!isMatch) {
    req.flash('error', 'Email hoặc mật khẩu không đúng!');
    return res.redirect('back');
  }
  if (userExist.status == 'inactive') {
    req.flash('error', 'Tài khoản đã bị khóa!');
    return res.redirect('back');
  }
  req.session.account = {
    id: userExist._id,
    email: userExist.email,
    fullName:userExist.fullName,
    role: userExist.role,
  };
  const redirectUrl = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.cookie('token', userExist.token, {
    httpOnly: true, // bảo mật
    secure: false, // true nếu dùng HTTPS
    sameSite: 'lax',
  });
  res.redirect(redirectUrl);
}
module.exports.registerPost=async (req,res)=>{
  const {fullName,email,password,confirmPassword}=req.body;
  const userExist = await userModel.findOne({
    email: email,
    deleted: false,
  });
  if (userExist) {
    req.flash('error', 'Email đã tồn tại');
    return res.redirect('back');
  }
  if(password.length < 8) {
    req.flash('error', 'Mật khẩu phải có độ dài hơn 8 ký tự');
    return res.redirect('back'); 
  }
  if(password != confirmPassword) {
    req.flash('error', 'Mật khẩu nhập lại không khớp');
    return res.redirect('back');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const data={
    fullName:fullName,
    password:passwordHash,
    email:email,
    confirmPassword:passwordHash
  }
  await userModel.create(data);
  req.flash('success', 'Đăng ký thành công');
  res.redirect(`/auth/login`);
}
module.exports.logout = (req, res) => {
  req.session.destroy();
  res.clearCookie('token');
  res.redirect(`back`);
};
