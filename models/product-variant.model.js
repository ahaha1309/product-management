const mongoose = require('mongoose');

/**
 * Product Variant Schema - For size, color, SKU support
 * Enables complete product catalog management
 */

const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // Variant identifiers
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  
  // Variant options (size, color, etc.)
  attributes: {
    size: String,          // XS, S, M, L, XL
    color: String,         // Red, Blue, etc.
    material: String,      // Cotton, Polyester, etc.
    storage: String,       // For electronics: 128GB, 256GB
    processor: String,     // For electronics: i7, i9
    // Add custom attributes as needed
  },
  
  // Pricing for this variant (can be different from base product)
  pricing: {
    cost: { type: Number, default: 0 },           // Cost price
    price: { type: Number, required: true },      // Original price
    discount: { type: Number, default: 0 },      // Discount percentage
    finalPrice: { type: Number, required: true } // After discount
  },
  
  // Stock management
  stock: {
    quantity: { type: Number, required: true, default: 0 },
    reserved: { type: Number, default: 0 },
    available: { type: Number, required: true }
  },
  
  // Images specific to this variant
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Variant-specific details
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update availableStock before saving
productVariantSchema.pre('save', function(next) {
  this.stock.available = Math.max(0, this.stock.quantity - this.stock.reserved);
  next();
});

// Index for fast queries
productVariantSchema.index({ productId: 1, status: 1 });

productVariantSchema.index({ 'attributes.size': 1, 'attributes.color': 1 });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
