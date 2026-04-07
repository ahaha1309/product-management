const productModel = require('../../models/product.model');
const productHelper = require('../../helper/product');
const cartModel = require('../../models/cart.model');
const vnpay = require('../../helper/vnpay');
const qs = require('qs');
const crypto = require('crypto');
const orders = require('../../models/orders.model');

module.exports.index = async (req, res) => {
  const listSlugProduct = req.query.listProduct.split(',').filter((slug) => slug && slug != ' ');
  let products = [];
  const cart = await cartModel.findOne({ userId: res.locals.user._id });
  for (let slug of listSlugProduct) {
    const product = await productModel.findOne({ slug: slug });
    const indexProduct = cart.products.findIndex((item) => item.productId == product._id);
    const quantity = cart.products[indexProduct].quantity;
    product.newPrice = productHelper.priceNewProduct(product);
    product.quantity = quantity;
    products.push(product);
  }
  const checkoutData = {
    user: res.locals.user,

    products: products,

    appliedVoucher: {
      code: 'SUMMER2024',
      discount: 10,
    },

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
  const subtotal = checkoutData.products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const discountAmount = checkoutData.appliedVoucher
    ? Math.floor(subtotal * (checkoutData.appliedVoucher.discount / 100))
    : 0;

  const shippingFee = 30000;
  const total = subtotal - discountAmount + shippingFee;

  res.render('client/pages/order/index', {
    ...checkoutData,
    subtotal,
    discountAmount,
    shippingFee,
    total,
  });
};
module.exports.createPaymentUrl = async (req, res, next) => {
  try {
    // 1. Lấy cấu hình từ .env
    const tmnCode = process.env.vnp_TmnCode.trim();
    const secretKey = process.env.vnp_HashSecret.trim();
    const vnpUrl = process.env.vnp_Url.trim();
    const returnUrl = process.env.vnp_ReturnUrl.trim();

    // Kiểm tra biến môi trường bắt buộc
    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      return res.status(500).json({ code: '99', message: 'Thiếu cấu hình VNPAY trong .env' });
    }

    // 2. Lấy dữ liệu từ request body
    const { orderCode, amount } = req.body;

    if (!orderCode || !amount) {
      return res.status(400).json({ code: '01', message: 'Thiếu orderCode hoặc amount' });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ code: '02', message: 'Số tiền không hợp lệ' });
    }

    // 3. Format ngày giờ hiện tại: yyyyMMddHHmmss (theo múi giờ UTC+7)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const createDate = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join('');

    // 4. Lấy IP người dùng
    let ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    // Fix lỗi IP localhost của IPv6
    if (ipAddr === '::1') {
      ipAddr = '127.0.0.1';
    }

    const newOrder = new orders({
            userId: res.locals.user._id,
            orderCode: orderCode,
            title: 'Thanh toan cho ma GD: ' + orderCode,
            amount: amount 
            // Các trường còn lại tự động là: pending, VNPAY,...
        });
    await newOrder.save();

    // 5. Khởi tạo tham số VNPAY
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: String(orderCode),
      vnp_OrderInfo: 'Thanh toan cho ma GD: ' + orderCode,
      vnp_OrderType: 'other',
      vnp_Amount: Number(amount) * 100, // VNPAY yêu cầu nhân 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // 6. Sắp xếp tham số theo alphabet
    vnp_Params = vnpay.sortObject(vnp_Params);

    // 7. Tạo chữ ký HMAC-SHA512
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex'); // Bỏ "new" trước Buffer

    // Thêm chữ ký vào cuối (KHÔNG sort lại sau bước này)
    vnp_Params['vnp_SecureHash'] = signed;

    // 8. Tạo payment URL và trả về
    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

    return res.status(200).json({ code: '00', paymentUrl });
  } catch (err) {
    next(err); // Chuyển lỗi về error handler middleware
  }
};
module.exports.vnpReturn=(req,res)=>{
  req.flash('success','Thanh toán thành công!')
  res.redirect('/')
}
module.exports.vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // 1. Sắp xếp và kiểm tra chữ ký (Giống bước tạo link)
        vnp_Params = vnpay.sortObject(vnp_Params);
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", process.env.vnp_HashSecret.trim());
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash !== signed) {
            return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
        }

        // 2. Tìm đơn hàng trong Database
        const orderCode = vnp_Params['vnp_TxnRef'];
        const order = await Orders.findOne({ orderCode: orderCode });

        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // 3. Kiểm tra số tiền (vnp_Amount gửi về gấp 100 lần số tiền thực)
        if (order.amount !== Number(vnp_Params['vnp_Amount']) / 100) {
            return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        }

        // 4. Kiểm tra trạng thái đơn hàng (Tránh update 2 lần)
        if (order.paymentStatus !== 'pending') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        // 5. Cập nhật trạng thái dựa trên vnp_ResponseCode
        if (vnp_Params['vnp_ResponseCode'] === '00') {
            order.paymentStatus = 'success';
            // Lưu thêm thông tin giao dịch để đối soát sau này
            order.vnpayTransactionInfo = {
                vnp_TransactionNo: vnp_Params['vnp_TransactionNo'],
                vnp_BankCode: vnp_Params['vnp_BankCode'],
                vnp_PayDate: vnp_Params['vnp_PayDate']
            };
        } else {
            order.paymentStatus = 'failed';
        }

        await order.save();

        // Trả về kết quả cho VNPAY biết là bạn đã nhận được tin
        res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });

    } catch (error) {
        res.status(200).json({ RspCode: '99', Message: 'Unknow error' });
    }
};