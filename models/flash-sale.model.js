const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 90
    },
    quantityLimit: {
      type: Number,
      default: null // Null means no limit
    },
    customerLimit: {
      type: Number,
      default: null // Null means no limit per customer
    },
    soldQuantity: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Indexes to optimize queries for active flash sales
flashSaleSchema.index({ startDate: 1, endDate: -1 });
flashSaleSchema.index({ deleted: 1 });
flashSaleSchema.index({ 'products.productId': 1 });

const FlashSale = mongoose.model('FlashSale', flashSaleSchema, 'flash-sales');
module.exports = FlashSale;
