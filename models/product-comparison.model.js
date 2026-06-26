const mongoose = require('mongoose');

/**
 * Product Comparison Schema
 * Allow users to compare multiple products side-by-side
 */

const comparisonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  sessionId: String, // For anonymous users
  
  products: [{
    productId: {
      type: mongoose.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: { type: Date, default: Date.now }
  }],
  
  totalItems: {
    type: Number,
    default: 0
  },
  
  comparisonUrl: String, // Shareable comparison link
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-calculate total items
comparisonSchema.pre('save', function(next) {
  this.totalItems = this.products.length;
  next();
});

comparisonSchema.index({ userId: 1 });
comparisonSchema.index({ sessionId: 1 });

module.exports = mongoose.model('ProductComparison', comparisonSchema);
