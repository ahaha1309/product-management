const cron = require('node-cron');
const Cart = require('../models/cart.model');
const User = require('../models/user.model');
const mailHelper = require('../helper/sendEmail');

// Chạy vào lúc 10:00 sáng mỗi ngày
cron.schedule('0 10 * * *', async () => {
  console.log('--- Bắt đầu chạy Job: Quét giỏ hàng bị bỏ quên ---');
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Tìm các giỏ hàng chưa được thanh toán (chưa xóa), có sản phẩm, 
    // đã tồn tại/update trước đó 24h, và chưa từng gửi email nhắc nhở
    const abandonedCarts = await Cart.find({
      updatedAt: { $lte: twentyFourHoursAgo },
      'products.0': { $exists: true }, // Có ít nhất 1 sản phẩm
      abandonedEmailSent: { $ne: true }, // Chưa gửi mail
      userId: { $exists: true, $ne: "" } // Chỉ gửi cho khách có tài khoản
    });

    console.log(`Tìm thấy ${abandonedCarts.length} giỏ hàng bị bỏ quên.`);

    for (const cart of abandonedCarts) {
      const user = await User.findById(cart.userId);
      if (user && user.email) {
        try {
          // Gửi email nhắc nhở
          await mailHelper.sendAbandonedCartEmail(user, cart);
          
          // Đánh dấu là đã gửi
          cart.abandonedEmailSent = true;
          await cart.save();
          console.log(`Đã gửi email nhắc nhở giỏ hàng cho ${user.email}`);
        } catch (mailErr) {
          console.error(`Lỗi gửi mail cho ${user.email}:`, mailErr);
        }
      }
    }
  } catch (error) {
    console.error('Lỗi Job Quét giỏ hàng:', error);
  }
  console.log('--- Kết thúc Job: Quét giỏ hàng bị bỏ quên ---');
});
