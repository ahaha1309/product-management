const Product = require('../../models/product.model');
const Order = require('../../models/orders.model');
const User = require('../../models/user.model');

module.exports.dashboard = async (req, res) => {
  try {
    // Thống kê sản phẩm
    const productStats = {
      total: await Product.countDocuments({ deleted: false }),
      active: await Product.countDocuments({ status: 'active', deleted: false }),
      inactive: await Product.countDocuments({ status: 'inactive', deleted: false }),
    };

    // Thống kê tài khoản (khách hàng)
    const userStats = {
      total: await User.countDocuments({ deleted: false }),
      active: await User.countDocuments({ status: 'active', deleted: false }),
      inactive: await User.countDocuments({ status: 'inactive', deleted: false }),
    };

    // Thống kê đơn hàng
    const orders = await Order.find();
    let orderStats = {
      total: orders.length,
      pending: 0,
      processing: 0, // confirm
      finished: 0,
      canceled: 0,
      revenue: 0
    };

    orders.forEach(order => {
      if (order.status === 'pending') orderStats.pending++;
      else if (order.status === 'confirm') orderStats.processing++;
      else if (order.status === 'finish') {
        orderStats.finished++;
        orderStats.revenue += order.amount || 0; // Chỉ tính doanh thu đơn hoàn thành
      }
      else if (order.status === 'canceled') orderStats.canceled++;
    });

    res.render('admin/pages/dashboard/index', {
      title: 'Trang tổng quan',
      productStats,
      userStats,
      orderStats
    });
  } catch (error) {
    console.error(error);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};
