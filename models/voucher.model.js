const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: String,
  discountPercentage: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number, default: 0 },
  minOrderValue: { type: Number, default: 0 },
  validFrom: Date,
  validTo: Date,
  usageLimit: { type: Number, default: 1 }, // Số lần dùng tối đa của voucher này
  usedCount: { type: Number, default: 0 },
  // Nếu voucher dành riêng cho 1 user nào đó
  userId: { type: String, default: null },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  }
},
{
  timestamps: true
});

const Voucher = mongoose.model('Voucher', voucherSchema, 'vouchers');
module.exports = Voucher;
