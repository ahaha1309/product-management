const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const orderService = require('../../services/order.service');
const orders = require('../../models/orders.model');

let mongoServer;

describe('VNPAY IPN Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await orders.deleteMany({});
    
    process.env.vnp_TmnCode = 'MOCK_TMN_CODE';
    process.env.vnp_HashSecret = 'MOCK_SECRET_KEY_1234567890_LONG_ENOUGH';
  });

  it('should successfully update order status on valid VNPAY callback', async () => {
    // 1. Create a pending order
    const order = new orders({
      orderCode: 'ORDER_SUCCESS',
      amount: 100000,
      paymentStatus: 'pending',
      status: 'pending'
    });
    await order.save();

    // 2. Generate a valid signature for IPN
    const crypto = require('crypto');
    const qs = require('qs');
    const vnpay = require('../../helper/vnpay');

    const mockParams = {
      vnp_Amount: '10000000', // 100k * 100
      vnp_TxnRef: 'ORDER_SUCCESS',
      vnp_ResponseCode: '00', // Success
      vnp_TransactionNo: '123456',
      vnp_BankCode: 'NCB',
      vnp_PayDate: '20230101120000'
    };

    const sortedParams = vnpay.sortObject(mockParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', process.env.vnp_HashSecret);
    const validHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const ipnPayload = { ...mockParams, vnp_SecureHash: validHash };

    // 3. Process IPN
    const result = await orderService.processVnpayIPN(ipnPayload);

    // 4. Assertions
    expect(result.RspCode).toBe('00');
    expect(result.Message).toBe('Confirm Success');

    const updatedOrder = await orders.findOne({ orderCode: 'ORDER_SUCCESS' });
    expect(updatedOrder.paymentStatus).toBe('success');
    expect(updatedOrder.vnpayTransactionInfo.vnp_TransactionNo).toBe('123456');
  });

  it('should reject invalid signature (Security)', async () => {
    const order = new orders({
      orderCode: 'ORDER_INVALID_SIG',
      amount: 100000,
      paymentStatus: 'pending'
    });
    await order.save();

    const ipnPayload = {
      vnp_Amount: '10000000',
      vnp_TxnRef: 'ORDER_INVALID_SIG',
      vnp_ResponseCode: '00',
      vnp_SecureHash: 'FAKE_SIGNATURE'
    };

    const result = await orderService.processVnpayIPN(ipnPayload);
    
    expect(result.RspCode).toBe('97');
    expect(result.Message).toBe('Fail checksum');

    const checkOrder = await orders.findOne({ orderCode: 'ORDER_INVALID_SIG' });
    expect(checkOrder.paymentStatus).toBe('pending'); // Unchanged
  });

  it('should ignore duplicate callbacks (Idempotency)', async () => {
    const order = new orders({
      orderCode: 'ORDER_DUPLICATE',
      amount: 100000,
      paymentStatus: 'success' // Already processed
    });
    await order.save();

    const crypto = require('crypto');
    const qs = require('qs');
    const vnpay = require('../../helper/vnpay');

    const mockParams = {
      vnp_Amount: '10000000',
      vnp_TxnRef: 'ORDER_DUPLICATE',
      vnp_ResponseCode: '00'
    };

    const sortedParams = vnpay.sortObject(mockParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', process.env.vnp_HashSecret);
    const validHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const ipnPayload = { ...mockParams, vnp_SecureHash: validHash };

    const result = await orderService.processVnpayIPN(ipnPayload);
    
    expect(result.RspCode).toBe('02');
    expect(result.Message).toBe('Order already confirmed');
  });
});
