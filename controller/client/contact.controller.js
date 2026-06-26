module.exports.index = async (req, res) => {
  const isLogin = req.cookies.token ? true : false;
  res.render('client/pages/contact/index', {
    title: 'Liên hệ - VanHa Tech Store',
    isLogin: isLogin,
  });
};

module.exports.post = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  // TODO: Send email via nodemailer to vanhanguyen2k4@gmail.com
  req.flash('success', `Cảm ơn ${name}! Chúng tôi sẽ liên hệ lại với bạn qua số ${phone || email} sớm nhất.`);
  res.redirect('/contact');
};
