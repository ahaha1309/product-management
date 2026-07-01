const orders = require('../models/orders.model');
const generate = require('../helper/generate');
const sendEmail = require('../helper/sendEmail');
const inventoryService = require('./inventory.service');
const loyaltyService = require('./loyalty.service');
const paymentService = require('./payment.service');

class OrderService {
  /**
   * Orchestrates the complete checkout process: 
   * Validation -> Saving Order -> Points -> Inventory Deduction -> Notifications
   */
  async processCheckout(user, rawProducts, amount, paymentMethod, shippingAddress, orderNote, voucherCode) {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      throw new Error('Số tiền không hợp lệ');
    }

    const orderCode = generate.generateOrderCode();
    
    // 1. Validate constraints & enrich products with full info (including flash sale and variants)
    const enrichedProducts = await inventoryService.validateAndEnrichProducts(rawProducts, user._id);

    // 2. Snapshot shipping address
    const addressSnapshot = shippingAddress || {
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
    };

    // 3. Create the Order in database
    const newOrder = new orders({
      userId: user._id,
      orderCode: orderCode,
      products: enrichedProducts,
      title: 'Thanh toan cho ma GD: ' + orderCode,
      amount: amount,
      paymentMethod: paymentMethod,
      shippingAddress: addressSnapshot,
      orderNote: orderNote || '',
      timeline: [{
        status: 'pending',
        note: 'Đơn hàng đã được tạo thành công',
        updatedBy: user.fullName || 'Hệ thống'
      }]
    });

    // Handle voucher logic
    if (voucherCode) {
      const Voucher = require('../models/voucher.model');
      await Voucher.updateOne(
        { code: voucherCode },
        { 
          $inc: { usedCount: 1 },
          $push: { usedBy: user._id.toString() }
        }
      );
    }

    await newOrder.save();

    // 4. Add Loyalty Points
    await loyaltyService.addPointsForPurchase(user._id, newOrder._id, amount);

    // 5. Deduct Inventory (Base, Variants, Flash Sale)
    await inventoryService.deductStock(enrichedProducts);

    // 6. Send Email Confirmation
    try {
      await sendEmail.sendOrderConfirmationEmail(newOrder, user);
    } catch (err) {
      console.error("Error sending order confirmation email:", err);
    }

    // 7. Notify Admins via Socket
    try {
      const Notification = require('../models/notification.model');
      const notif = new Notification({
        type: 'order',
        title: 'Đơn hàng mới',
        message: `Khách hàng ${user.fullName} vừa đặt đơn hàng ${orderCode} trị giá ${amount.toLocaleString('vi-VN')}đ`,
        link: `/admin/orders`,
        isAdmin: true
      });
      await notif.save();

      if (global._io) {
        global._io.emit('ADMIN_NEW_NOTIFICATION', {
          title: notif.title,
          message: notif.message,
          link: notif.link,
          time: new Date()
        });
      }
    } catch (err) {
      console.error('Error notifying admin:', err);
    }

    return newOrder;
  }

  /**
   * Processes VNPAY IPN webhook calls safely and idempotently.
   */
  async processVnpayIPN(vnp_Params) {
    if (!paymentService.verifyVnpaySignature(vnp_Params)) {
      return { RspCode: '97', Message: 'Fail checksum' };
    }

    const orderCode = vnp_Params['vnp_TxnRef'];
    const order = await orders.findOne({ orderCode: orderCode });

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (order.amount !== Number(vnp_Params['vnp_Amount']) / 100) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // Idempotent constraint: do not update if already processed
    if (order.paymentStatus !== 'pending') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (vnp_Params['vnp_ResponseCode'] === '00') {
      order.paymentStatus = 'success';
      order.vnpayTransactionInfo = {
        vnp_TransactionNo: vnp_Params['vnp_TransactionNo'],
        vnp_BankCode: vnp_Params['vnp_BankCode'],
        vnp_PayDate: vnp_Params['vnp_PayDate']
      };
    } else {
      order.paymentStatus = 'failed';
    }

    await order.save();
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}

module.exports = new OrderService();
