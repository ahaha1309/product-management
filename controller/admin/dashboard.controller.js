module.exports.dashboard = (req, res) => {
  res.render('admin/pages/dashboard/index', {
    title: 'Trang tổng quan',
    message: 'Trang tổng quan',
  });
};
