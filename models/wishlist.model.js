const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  products: [
    {
      productId: String,
      addedAt: {
        type: Date,
        default: Date.now
      },
      notes: String // Ghi chú cá nhân về sản phẩm
    }
  ],
  totalItems: {
    type: Number,
    default: 0
  }
},
{
  timestamps: true
});

// Hook để tự động cập nhật totalItems
wishlistSchema.pre('save', function() {
  this.totalItems = this.products.length;
});

wishlistSchema.index({ userId: 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema, 'wishlists');
module.exports = Wishlist;
