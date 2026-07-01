const productModel = require('../../models/product.model');
const productHelper = require('../../helper/product');
const flashSaleHelper = require('../../helper/flash-sale');
const cartModel = require('../../models/cart.model');
const vnpay = require('../../helper/vnpay');
const qs = require('qs');
const crypto = require('crypto');
const orders = require('../../models/orders.model');
const userModel = require('../../models/user.model');
const sendEmail = require('../../helper/sendEmail');

//get checkout 
module.exports.index = async (req, res) => {
  let products = [];
  const cart = await cartModel.findOne({ userId: res.locals.user._id });
  //mua nhiều sản phẩm từ giỏ hàng
  if(req.query.listProduct){
    const items = req.query.listProduct.split(',').filter((i) => i && i != ' ');
    for (let itemStr of items) {
      let slug = itemStr;
      let variant = '';
      if (itemStr.includes('|')) {
        const parts = itemStr.split('|');
        slug = parts[0];
        variant = parts[1];
      }
      const product = await productModel.findOne({ slug: slug }).lean();
      if (!product) continue;
      
      const cartItem = cart ? cart.products.find((item) => item.productId == product._id && (item.variantText || '') === variant) : null;
      const quantity = cartItem ? cartItem.quantity : 1;
      
      product.quantity = quantity;
      product.variantText = variant;
      products.push(product);
    }
  }
  // mua 1 sản phẩm
  if(req.query.product&&req.query.quantity){
    const product=await productModel.findOne({slug:req.query.product}).lean();
    if (product) {
      product.quantity = parseInt(req.query.quantity);
      product.variantText = req.query.variant || '';
      products.push(product);
    }
  }

  // Apply Flash Sale Pricing
  if (products.length > 0) {
    const processedProducts = await flashSaleHelper.applyFlashSaleToProducts(products);
    products = processedProducts.map((p, index) => {
      p.quantity = products[index].quantity;
      p.variantText = products[index].variantText;
      return p;
    });
  }
  // Fetch valid vouchers
  const Voucher = require('../../models/voucher.model');
  const userId = res.locals.user._id.toString();
  const allVouchers = await Voucher.find({
    status: 'active',
    validFrom: { $lte: new Date() },
    validTo: { $gte: new Date() }
  });
  // Lọc voucher: chưa hết lượt dùng + user chưa dùng
  const availableVouchers = allVouchers.filter(v => 
    v.usedCount < v.usageLimit && !v.usedBy.includes(userId)
  );

  let appliedVoucher = null;
  const subtotal = products.reduce((sum, p) => sum + p.newPrice * p.quantity, 0);

  if (req.query.voucherCode) {
    const vc = await Voucher.findOne({
      code: req.query.voucherCode.toUpperCase(),
      status: 'active',
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() }
    });

    if (vc && subtotal >= vc.minOrderValue && vc.usedCount < vc.usageLimit && !vc.usedBy.includes(userId)) {
      appliedVoucher = {
        code: vc.code,
        type: vc.type || 'percentage',
        discount: vc.discountPercentage,
        maxDiscountAmount: vc.maxDiscountAmount
      };
    }
  }

  const checkoutData = {
    user: res.locals.user,
    products: products,
    appliedVoucher: appliedVoucher,
    availableVouchers: availableVouchers,
    paymentMethods: [
      {
        id: 'credit_card',
        name: 'Thẻ tín dụng / Ghi nợ',
        description: 'Visa, MasterCard, JCB',
        icon: '💳',
      },
      {
        id: 'e_wallet',
        name: 'Ví điện tử',
        description: 'Momo, ZaloPay, PayPal',
        icon: '📱',
      },
      {
        id: 'bank_transfer',
        name: 'Chuyển khoản ngân hàng',
        description: 'Ngân hàng Việt Nam',
        icon: '🏦',
      },
      {
        id: 'cod',
        name: 'Thanh toán khi nhận hàng',
        description: 'COD - Không phí giao hàng',
        icon: '🚚',
      },
    ],
  };

  let discountAmount = 0;
  if (checkoutData.appliedVoucher && checkoutData.appliedVoucher.type !== 'freeship') {
    discountAmount = Math.floor(subtotal * (checkoutData.appliedVoucher.discount / 100));
    if (checkoutData.appliedVoucher.maxDiscountAmount > 0 && discountAmount > checkoutData.appliedVoucher.maxDiscountAmount) {
      discountAmount = checkoutData.appliedVoucher.maxDiscountAmount;
    }
  }

  const BASE_SHIPPING = 30000;
  const freeshipDiscount = (checkoutData.appliedVoucher && checkoutData.appliedVoucher.type === 'freeship') ? BASE_SHIPPING : 0;
  const shippingFee = BASE_SHIPPING - freeshipDiscount;
  const total = subtotal - discountAmount + shippingFee;

  res.render('client/pages/order/index', {
    ...checkoutData,
    subtotal,
    title: 'Chi tiết đơn hàng',
    discountAmount,
    freeshipDiscount,
    shippingFee,
    total,
  });
};
// chuyển hướng thanh toán
const orderService = require('../../services/order.service');
const paymentService = require('../../services/payment.service');

module.exports.createPaymentUrl = async (req, res, next) => {
  try {
    const { amount, paymentMethod, products, shippingAddress, orderNote, voucherCode } = req.body;

    const newOrder = await orderService.processCheckout(
      res.locals.user, 
      products, 
      amount, 
      paymentMethod, 
      shippingAddress, 
      orderNote, 
      voucherCode
    );

    if (paymentMethod === 'cod') {
      return res.status(200).json({ 
        code: '00', 
        message: 'Đặt hàng thành công',
        isCOD: true 
      });
    }

    let ipAddr = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
    
    const paymentUrl = paymentService.generateVnpayUrl(amount, newOrder.orderCode, ipAddr);

    return res.status(200).json({ code: '00', paymentUrl });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ code: '99', message: err.message });
    }
    next(err);
  }
};
module.exports.vnpReturn = async (req, res) => {
  try {
    const isValid = paymentService.verifyVnpaySignature(req.query);

    if (isValid) {
      const orderCode = req.query['vnp_TxnRef'];
      const order = await orders.findOne({ orderCode: orderCode });

      if (order && order.paymentStatus === 'pending') {
        if (req.query['vnp_ResponseCode'] === '00') {
          order.paymentStatus = 'success';
          order.vnpayTransactionInfo = {
            vnp_TransactionNo: req.query['vnp_TransactionNo'],
            vnp_BankCode: req.query['vnp_BankCode'],
            vnp_PayDate: req.query['vnp_PayDate']
          };
        } else {
          order.paymentStatus = 'failed';
        }
        await order.save();
      }

      if (req.query['vnp_ResponseCode'] === '00') {
        req.flash('success', 'Thanh toán thành công!');
      } else {
        req.flash('error', 'Thanh toán thất bại hoặc đã bị hủy!');
      }
    } else {
      req.flash('error', 'Chữ ký VNPAY không hợp lệ!');
    }
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra khi xử lý thanh toán!');
  }
  
  res.redirect('/order/history');
};
// [GET] /order/print/:id
module.exports.printInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orders.findOne({
      _id: orderId,
      userId: res.locals.user.id
    });

    if (!order) {
      return res.redirect('/order/history');
    }

    res.render('client/pages/order/invoice', {
      title: 'In Hóa Đơn',
      order: order,
      layout: false // Do not use default layout for invoice
    });
  } catch (error) {
    console.error("Lỗi khi in hóa đơn:", error);
    res.redirect('back');
  }
};
module.exports.vnpayIPN = async (req, res) => {
  try {
    const result = await orderService.processVnpayIPN(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};
module.exports.editInfo=async(req,res)=>{
  const {id,name,phone,address}=req.body;
  console.log(id,name,phone,address)
  try {
    await userModel.updateOne({_id:id},{fullName:name,phone:phone,address:address})
    res.redirect('back')
    req.flash('success','Cập nhật thông tin thành công');
  } catch (error) {
    console.log(error)
  }
}
//get trang đơn hàng
module.exports.historyOrder = async (req, res) => {
  try {
    const find = { userId: res.locals.user._id };
    const statusOrder = req.query.status;
    if (statusOrder) {
      find.status = statusOrder;
    }
    const listOrders = await orders.find(find).sort({ createdAt: -1 });
    res.render('client/pages/order/orderHistory', {
      title: 'Dơn hàng của bạn',
      orders: listOrders,
      status: statusOrder || ''
    });
  } catch (error) {
    console.log(error);
  }
}
//chi tiết đơn hàng
module.exports.detailOrder = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await orders.findOne({_id: id});
    const user = await userModel.findOne({_id: res.locals.user._id});

    const Product = require('../../models/product.model');
    const productsInfo = await Promise.all(order.products.map(async (item) => {
      const product = await Product.findById(item.productId);
      const itemObj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
      return {
        ...itemObj,
        title: product?.title || 'Sản phẩm không xác định',
        thumbnail: product?.thumbnail || '',
        newPrice: product?.price ? (product.price * (1 - (product.discountPercentage || 0) / 100)) : (item.price || 0)
      };
    }));

    const orderObj = order.toObject();
    orderObj.products = productsInfo;

    res.render('client/pages/order/orderDetail', {
      title: "Chi tiết đơn hàng",
      order: orderObj,
      user: user
    });
  } catch (error) {
    console.log(error);
  }
}
//hủy đơn hàng
const inventoryService = require('../../services/inventory.service');

module.exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  const userId = res.locals.user._id;

  try {
    const order = await orders.findOne({ _id: orderId, userId: userId });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.status === 'finish' || order.status === 'canceled') {
      return res.status(400).json({ message: 'Đơn hàng này không thể hủy' });
    }

    if (order.status === 'confirm') {
      order.cancelRequest = true;
      await order.save();
      return res.status(200).json({ message: 'Yêu cầu hủy đã được gửi', type: 'request' });
    }

    order.paymentStatus = 'failed';
    order.status = 'canceled';
    order.canceledAt = Date.now();
    await order.save();

    // Rollback stock safely through inventory service
    await inventoryService.restoreStock(order.products);

    try {
      await sendEmail.sendOrderCancellationEmail(order, res.locals.user);
    } catch (e) {
      console.log('Error sending cancel email:', e);
    }

    res.status(200).json({ message: 'Hủy đơn hàng thành công', type: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Mua lại đơn hàng
module.exports.rebuyOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = res.locals.user._id;

    const order = await orders.findOne({ _id: orderId, userId: userId });
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng');
      return res.redirect('/order/history');
    }

    // Tìm hoặc tạo giỏ hàng
    let cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      cart = await cartModel.create({ userId: userId, products: [] });
    }

    // Thêm từng sản phẩm của đơn hàng vào giỏ
    for (const item of order.products) {
      const existIndex = cart.products.findIndex(
        (p) => p.productId.toString() === item.productId.toString()
      );
      if (existIndex >= 0) {
        cart.products[existIndex].quantity += item.quantity;
      } else {
        cart.products.push({
          productId: item.productId,
          quantity: item.quantity
        });
      }
    }
    await cart.save();

    req.flash('success', 'Dạ đƣ thêm sản phẩm vào giỏ hàng!');
    res.redirect('/cart');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại');
    res.redirect('/order/history');
  }
};

// [GET] /order/print/:id
module.exports.printInvoice = async (req, res) => {
  try {
    const order = await orders.findOne({
      _id: req.params.id,
      userId: res.locals.user._id
    });
    
    if (!order) {
      req.flash('error', 'Đơn hàng không tồn tại');
      return res.redirect('/order/history');
    }

    const Product = require('../../models/product.model');
    const productsInfo = await Promise.all(order.products.map(async (item) => {
      const product = await Product.findById(item.productId);
      const itemObj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
      return {
        ...itemObj,
        title: product?.title || 'Sản phẩm không xác định',
        thumbnail: product?.thumbnail || '',
      };
    }));

    const orderObj = order.toObject();
    orderObj.products = productsInfo;

    res.render('admin/pages/order/invoice', { 
      order: orderObj, 
      user: res.locals.user,
      title: 'In Hóa Đơn - ' + orderObj.orderCode
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [POST] /order/validate-voucher
module.exports.validateVoucher = async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) {
      return res.status(400).json({ code: 400, message: 'Thiếu mã voucher' });
    }

    const Voucher = require('../../models/voucher.model');
    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      status: 'active'
    });

    if (!voucher) {
      return res.status(404).json({ code: 404, message: 'Mã voucher không tồn tại hoặc đã hết hạn.' });
    }

    // Validate date
    const now = new Date();
    if (voucher.validFrom && new Date(voucher.validFrom) > now) {
      return res.status(400).json({ code: 400, message: 'Voucher chưa đến thời gian áp dụng.' });
    }
    if (voucher.validTo && new Date(voucher.validTo) < now) {
      return res.status(400).json({ code: 400, message: 'Voucher đã hết hạn.' });
    }

    // Check usage limits
    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ code: 400, message: 'Voucher này đã hết lượt sử dụng.' });
    }

    // Check if user already used it
    const userId = res.locals.user ? res.locals.user._id.toString() : null;
    if (userId && voucher.usedBy && voucher.usedBy.includes(userId)) {
      return res.status(400).json({ code: 400, message: 'Bạn đã sử dụng voucher này rồi.' });
    }

    // Check min order value
    if (voucher.minOrderValue > 0 && amount < voucher.minOrderValue) {
      return res.status(400).json({ code: 400, message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}₫ để áp dụng.` });
    }

    // Calculate discount based on voucher type
    const voucherType = voucher.type || 'percentage';
    let discount = 0;
    let freeshipAmount = 0;

    if (voucherType === 'freeship') {
      freeshipAmount = 30000; // Fixed shipping fee
    } else if (voucher.discountPercentage > 0) {
      discount = amount * (voucher.discountPercentage / 100);
      if (voucher.maxDiscountAmount > 0 && discount > voucher.maxDiscountAmount) {
        discount = voucher.maxDiscountAmount;
      }
    }

    return res.status(200).json({
      code: 200,
      message: 'Áp dụng voucher thành công',
      voucher: {
        code: voucher.code,
        type: voucherType,
        discountAmount: discount,
        freeshipAmount: freeshipAmount,
        percentage: voucher.discountPercentage
      }
    });

  } catch (error) {
    console.log('Error validating voucher:', error);
    res.status(500).json({ code: 500, message: 'Lỗi server' });
  }
};