const crypto = require('crypto');
const qs = require('qs');
const vnpay = require('../helper/vnpay');

class PaymentService {
  /**
   * Generates a VNPAY payment URL
   */
  generateVnpayUrl(amount, orderCode, ipAddr) {
    if (!process.env.vnp_TmnCode || !process.env.vnp_HashSecret || !process.env.vnp_Url || !process.env.vnp_ReturnUrl) {
      throw new Error('Thiếu cấu hình VNPAY trong .env');
    }

    const tmnCode = process.env.vnp_TmnCode.trim();
    const secretKey = process.env.vnp_HashSecret.trim();
    const vnpUrl = process.env.vnp_Url.trim();
    const returnUrl = process.env.vnp_ReturnUrl.trim();

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

    return vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });
  }

  /**
   * Verifies the VNPAY signature from IPN or Return payload
   */
  verifyVnpaySignature(vnp_Params) {
    let secureHash = vnp_Params['vnp_SecureHash'];

    // Copy to avoid mutating original req.query
    const params = { ...vnp_Params };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    if (!process.env.vnp_HashSecret) {
      return false;
    }

    const sortedParams = vnpay.sortObject(params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.vnp_HashSecret.trim());
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    return secureHash === signed;
  }
}

module.exports = new PaymentService();
