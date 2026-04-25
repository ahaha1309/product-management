const productModel = require('../../models/product.model');
const productHelper = require('../../helper/product');
const cartModel = require('../../models/cart.model');
const vnpay = require('../../helper/vnpay');
const qs = require('qs');
const crypto = require('crypto');
const orders = require('../../models/orders.model');
const userModel=require('../../models/user.model')

//get checkout 
module.exports.index = async (req, res) => {
  let products = [];
  const cart = await cartModel.findOne({ userId: res.locals.user._id });
  //mua nhiều sản phẩm
  if(req.query.listProduct){
  const listSlugProduct = req.query.listProduct.split(',').filter((slug) => slug && slug != ' ');
  for (let slug of listSlugProduct) {
    const product = await productModel.findOne({ slug: slug });
    const indexProduct = cart.products.findIndex((item) => item.productId == product._id);
    const quantity = cart.products[indexProduct].quantity;
    product.newPrice = productHelper.priceNewProduct(product);
    product.quantity = quantity;
    products.push(product);
  }
}
//mua 1 sản phẩm
if(req.query.product&&req.query.quantity){
  const product=await productModel.findOne({slug:req.query.product})
  product.newPrice = productHelper.priceNewProduct(product);
  product.quantity = parseInt(req.query.quantity);
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
  const subtotal = checkoutData.products.reduce((sum, p) => sum + p.newPrice * p.quantity, 0);

  const discountAmount = checkoutData.appliedVoucher
    ? Math.floor(subtotal * (checkoutData.appliedVoucher.discount / 100))
    : 0;

  const shippingFee = 30000;
  const total = subtotal - discountAmount + shippingFee;

  res.render('client/pages/order/index', {
    ...checkoutData,
    subtotal,
    title:'Chi tiết đơn hàng',
    discountAmount,
    shippingFee,
    total,
  });
};
//chuyển hướng thanh toán
module.exports.createPaymentUrl = async (req, res, next) => {
  try {
    // Lấy dữ liệu từ request body (đã bổ sung paymentMethod)
    const { orderCode, amount, paymentMethod,products } = req.body;

    if (!orderCode || !amount) {
      return res.status(400).json({ code: '01', message: 'Thiếu orderCode hoặc amount' });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ code: '02', message: 'Số tiền không hợp lệ' });
    }
     for(let item of products){
      const id= item.productId;
      const product=await productModel.findOne({_id:id});
      const newPrice=productHelper.priceNewProduct(product);
      item.newPrice=newPrice
      item.thumbnail=product.thumbnail;
      item.title=product.title;
    }

    // 1. Tạo đơn hàng và lưu vào Database trước (áp dụng cho mọi phương thức)
    const newOrder = new orders({
      userId: res.locals.user._id,
      orderCode: orderCode,
      products:products,
      title: 'Thanh toan cho ma GD: ' + orderCode,
      amount: amount,
      paymentMethod: paymentMethod // Lưu thêm phương thức thanh toán vào DB
      // Các trường còn lại tự động là: pending,...
    });
    await newOrder.save();

    // 2. Xử lý logic theo phương thức thanh toán
    if (paymentMethod === 'cod') {
      // Nếu là COD: Chỉ cần trả về thành công, không tạo URL VNPAY
      return res.status(200).json({ 
        code: '00', 
        message: 'Đặt hàng thành công',
        isCOD: true 
      });
    }

    // ==========================================
    // 3. LOGIC CHO VNPAY (chỉ chạy khi không phải COD)
    // ==========================================
    const tmnCode = process.env.vnp_TmnCode.trim();
    const secretKey = process.env.vnp_HashSecret.trim();
    const vnpUrl = process.env.vnp_Url.trim();
    const returnUrl = process.env.vnp_ReturnUrl.trim();

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      return res.status(500).json({ code: '99', message: 'Thiếu cấu hình VNPAY trong .env' });
    }

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

    let ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
      
    if (ipAddr === '::1') {
      ipAddr = '127.0.0.1';
    }

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: String(orderCode),
      vnp_OrderInfo: 'Thanh toan cho ma GD: ' + orderCode,
      vnp_OrderType: 'other',
      vnp_Amount: Number(amount) * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    vnp_Params = vnpay.sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

    return res.status(200).json({ code: '00', paymentUrl });
  } catch (err) {
    next(err);
  }
};
module.exports.vnpReturn=(req,res)=>{
  req.flash('success','Thanh toán thành công!')
  res.redirect('/')
}
module.exports.vnpayIPN = async (req, res) => {
    try {
        console.log("=== VNPAY GỌI IPN ===", req.query);
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
        const order = await orders.findOne({ orderCode: orderCode });

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
    const find={
      userId: res.locals.user._id
    }
    const statusOrder=req.query.status;
    if(statusOrder){
      find.status=statusOrder
    }
    const listOrders = await orders.find(find);
    res.render('client/pages/order/orderHistory', {
      title:'Đơn hàng của bạn',
      orders: listOrders,
      status:statusOrder ?? ' ' // Truyền listOrders ra view
    });
  } catch (error) {
    console.log(error);
  }
}
//chi tiết đơn hàng
module.exports.detailOrder = async (req, res) => {
  try {
    const id=req.params.id;
    const order = await orders.findOne({_id:id});
    const user=await userModel.findOne({_id:res.locals.user._id})
    res.render('client/pages/order/orderDetail', {
      title:"Chi tiết đơn hàng",
      order:order,
      user:user // Truyền listOrders ra view
    });
  } catch (error) {
    console.log(error);
  }
}
//hủy đơn hàng
module.exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  const userId = res.locals.user._id;

  try {
    // Tìm đơn hàng thuộc về user hiện tại và đang ở trạng thái pending
    const order = await orders.findOne({
      _id: orderId,
      userId: userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Đơn hàng này không thể hủy (đã thanh toán hoặc đang giao)' });
    }

    // Cập nhật trạng thái thành cancelled (hoặc failed tùy bạn quy định)
    order.paymentStatus = 'failed'; 
    order.status='canceled';
    order.canceledAt=Date.now();
    // Nếu bạn có trường status riêng cho vận chuyển thì cũng nên cập nhật
    // order.status = 'cancelled'; 
    
    await order.save();

    res.status(200).json({ message: 'Hủy đơn hàng thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};