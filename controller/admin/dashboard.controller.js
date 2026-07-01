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
      else if (order.status === 'finish') orderStats.finished++;
      else if (order.status === 'canceled') orderStats.canceled++;

      // Tính doanh thu: đơn hoàn thành HOẶC đã thanh toán thành công (và không bị hủy)
      if (order.status !== 'canceled' && (order.status === 'finish' || order.paymentStatus === 'success')) {
        orderStats.revenue += order.amount || 0;
      }
    });

    // Generate Last 7 Days Revenue Data for Chart.js
    const last7Days = [];
    const revenueByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      last7Days.push(dateString);
      revenueByDay[dateString] = 0;
    }

    orders.forEach(order => {
      if (order.status !== 'canceled' && (order.status === 'finish' || order.paymentStatus === 'success') && order.createdAt) {
        const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        if (revenueByDay[orderDate] !== undefined) {
          revenueByDay[orderDate] += (order.amount || 0);
        }
      }
    });

    const revenueChartData = last7Days.map(date => revenueByDay[date]);

    res.render('admin/pages/dashboard/index', {
      title: 'Trang tổng quan',
      productStats,
      userStats,
      orderStats,
      chartLabels: JSON.stringify(last7Days),
      chartData: JSON.stringify(revenueChartData)
    });
  } catch (error) {
    console.error(error);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};
