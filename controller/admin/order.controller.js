const Order =require('../../models/orders.model');
const User=require('../../models/user.model')
const mailHelper=require('../../helper/sendEmail')

// [GET] /admin/orders
module.exports.index = async (req, res) => {
  try {
    // Lấy tất cả đơn hàng, sắp xếp mới nhất lên đầu
    // Nếu bạn có model User, có thể dùng .populate('userId', 'fullName phone') để lấy thông tin người đặt
    const orders = await Order.find().sort({ createdAt: -1 });

    res.render('admin/pages/order/index', {
      title: 'Quản lý đơn hàng',
      orders: orders
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [PATCH] /admin/orders/change-status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;

    const updateData = { status: status };
    
    if (status === 'canceled') {
      updateData.canceledAt = new Date();
    }

    // 1. Cập nhật trạng thái đơn hàng vào Database
    await Order.updateOne({ _id: id }, updateData);

    // ==========================================
    // 2. LOGIC GỬI EMAIL KHI XÁC NHẬN ĐƠN HÀNG
    // ==========================================
    if (status === 'confirm') {
      // Lấy lại thông tin đơn hàng vừa update
      const order = await Order.findById(id);
      
      if (order && order.userId) {
        // Tìm User để lấy được địa chỉ email
        const user = await User.findById(order.userId);
        
        if (user && user.email) {
          // GỌI HÀM GỬI MAIL (Chạy ngầm không dùng await để tránh client phải chờ lâu)
          mailHelper.sendOrderConfirmationEmail(order, user).catch(err => {
             console.log("Lỗi gửi mail ngầm:", err);
          });
        }
      }
    }

    res.status(200).json({ code: 200, message: 'Cập nhật trạng thái thành công!' });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Cập nhật thất bại!' });
  }
};
// [PATCH] /admin/orders/change-payment-status/:id
module.exports.changePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    // Cập nhật vào trường paymentStatus trong model Orders
    await Order.updateOne(
      { _id: id }, 
      { paymentStatus: paymentStatus }
    );

    res.status(200).json({
      code: 200,
      message: "Cập nhật thành công"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Lỗi hệ thống"
    });
  }
};
// [GET] /admin/orders/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const user=await User.findById(order.userId)
    // Nếu là yêu cầu lấy dữ liệu cho Pop-up
    if (req.query.type === 'json') {
      return res.json({
        code: 200,
        order: order,
        user:user
      });
    }

    // Nếu vẫn muốn có trang riêng thì render bình thường
    res.render('admin/pages/order/detail', { order: order });
  } catch (error) {
    res.status(404).json({ code: 404, message: "Không tìm thấy" });
  }
};