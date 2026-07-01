const mongoose = require('mongoose');
// Giả sử file này xuất ra function: module.exports.generateOrderCode = () => { ... }
const generate = require('../helper/generate'); 

const orderSchema = new mongoose.Schema({
  userId: String,
  // orderCode sẽ đóng vai trò là vnp_TxnRef (Mã giao dịch gửi sang VNPAY)
  orderCode:String,
  products: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number },
    newPrice: { type: Number },
    title: { type: String },
    thumbnail: { type: String },
    variantText: { type: String },
    variantId: { type: String },
    flashSaleId: { type: String }
  }],
  title: String,
  // ==========================================
  // CÁC TRƯỜNG THÊM VÀO ĐỂ PHỤC VỤ VNPAY
  // ==========================================
  
  amount: {
    type: Number,
    required: true, // Bắt buộc phải có số tiền để đối chiếu với vnp_Amount
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'], // Chỉ nhận 1 trong 3 trạng thái này
    default: 'pending' // Mặc định khi vừa tạo đơn là "Chờ thanh toán"
  },
  paymentMethod: {
    type: String,
    default: 'VNPAY' // Ghi chú lại phương thức thanh toán
  },
  
  // Object này dùng để lưu lại bằng chứng giao dịch VNPAY trả về qua IPN
  vnpayTransactionInfo: {
    vnp_TransactionNo: String, // Mã giao dịch ghi nhận trên hệ thống VNPAY (vd: 1425345)
    vnp_BankCode: String,      // Ngân hàng khách dùng để thanh toán (vd: NCB)
    vnp_PayDate: String,       // Thời gian thanh toán thành công
  },
  // ==========================================
  status:{
    type: String,
    enum: ['pending', 'confirm', 'finish', 'canceled'], 
    default: 'pending' 
  },
  cancelRequest: {
    type: Boolean,
    default: false
  },
  canceledAt: Date,
  // Lưu snapshot địa chỉ giao hàng tại thời điểm đặt hàng
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
  },
  // Ghi chú của khách hàng
  orderNote: {
    type: String,
    default: ''
  },
  // ==========================================
  // THÔNG TIN TIMELINE ĐỂ TRACKING
  // ==========================================
  timeline: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'System' }
  }],
},
{
  timestamps: true // Tự động sinh createdAt và updatedAt
});

orderSchema.index({ status: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ createdAt: -1 });

const Orders = mongoose.model('Orders', orderSchema, 'orders');
module.exports = Orders;