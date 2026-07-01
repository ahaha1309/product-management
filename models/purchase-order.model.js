const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poCode: { type: String, required: true, unique: true }, // Mã phiếu nhập (VD: PO12345)
  supplierId: { type: String, required: true }, // ID nhà cung cấp
  userId: { type: String, required: true }, // Admin nào tạo phiếu này
  products: [
    {
      productId: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true, min: 0 }
    }
  ],
  totalAmount: { type: Number, default: 0 },
  note: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'canceled'],
    default: 'pending'
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema, 'purchase-orders');
module.exports = PurchaseOrder;
