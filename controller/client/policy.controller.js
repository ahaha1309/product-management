module.exports.returnPolicy = (req, res) => {
  res.render('client/pages/policy/return', {
    title: 'Chính sách đổi trả'
  });
};

module.exports.privacyPolicy = (req, res) => {
  res.render('client/pages/policy/privacy', {
    title: 'Chính sách bảo mật'
  });
};
