const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: String, // Lưu tên người review
  userAvatar: String, // Avatar ng dùng
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  title: String, // Tiêu đề review
  comment: String,
  verifiedPurchase: {
    type: Boolean,
    default: false // Nếu user đã mua sản phẩm này
  },
  variantText: String, // Thuộc tính đã mua (Màu, Size...)
  helpful: {
    type: Number,
    default: 0 // Số người cho rằng review hữu ích
  },
  unhelpful: {
    type: Number,
    default: 0
  },
  images: {
    type: [String], // URL hình ảnh kèm review
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // Admin phải duyệt
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
},
{
  timestamps: true
});

// Index để search nhanh
reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema, 'reviews');
module.exports = Review;
