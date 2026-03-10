module.exports.index = (req, res) => {
  res.render('client/pages/home/index.pug', {
    title: 'Trang chủ',
    message: 'Trang chủ',
  });
};
