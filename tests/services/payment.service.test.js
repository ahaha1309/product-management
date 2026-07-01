const paymentService = require('../../services/payment.service');
const crypto = require('crypto');
const qs = require('qs');

describe('PaymentService Unit Tests', () => {
  beforeEach(() => {
    // Mock VNPAY env vars
    process.env.vnp_TmnCode = 'MOCK_TMN_CODE';
    process.env.vnp_HashSecret = 'MOCK_SECRET_KEY_1234567890_LONG_ENOUGH';
    process.env.vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.vnp_ReturnUrl = 'http://localhost:3000/order/vnpay_return';
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('generateVnpayUrl', () => {
    it('should generate a valid URL with checksum', () => {
      const amount = 100000; // 100k
      const orderCode = 'ORDER123';
      const ipAddr = '192.168.1.1';

      const url = paymentService.generateVnpayUrl(amount, orderCode, ipAddr);

      expect(url).toContain(process.env.vnp_Url);
      expect(url).toContain('vnp_Amount=10000000'); // amount * 100
      expect(url).toContain('vnp_TxnRef=ORDER123');
      expect(url).toContain('vnp_SecureHash=');
    });

    it('should throw error if env vars are missing', () => {
      delete process.env.vnp_TmnCode;

      expect(() => {
        paymentService.generateVnpayUrl(100000, 'ORDER123', '192.168.1.1');
      }).toThrow('Thiếu cấu hình VNPAY trong .env');
    });
  });

  describe('verifyVnpaySignature', () => {
    it('should return true for a valid signature', () => {
      const vnpay = require('../../helper/vnpay');
      const mockParams = {
        vnp_Amount: '10000000',
        vnp_Command: 'pay',
        vnp_CreateDate: '20230101120000',
        vnp_CurrCode: 'VND',
        vnp_IpAddr: '192.168.1.1',
        vnp_Locale: 'vn',
        vnp_OrderInfo: 'Thanh toan don hang',
        vnp_OrderType: 'other',
        vnp_ReturnUrl: 'http://localhost:3000/return',
        vnp_TmnCode: 'MOCK_TMN_CODE',
        vnp_TxnRef: 'ORDER123',
        vnp_Version: '2.1.0'
      };

      const sortedParams = vnpay.sortObject(mockParams);
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', process.env.vnp_HashSecret);
      const validHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      mockParams.vnp_SecureHash = validHash;

      const isValid = paymentService.verifyVnpaySignature(mockParams);
      expect(isValid).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      const mockParams = {
        vnp_Amount: '10000000',
        vnp_TxnRef: 'ORDER123',
        vnp_SecureHash: 'INVALID_FAKE_HASH_123'
      };

      const isValid = paymentService.verifyVnpaySignature(mockParams);
      expect(isValid).toBe(false);
    });
  });
});
