const Review = require('../../models/review.model');
const Product = require('../../models/product.model');
const Order = require('../../models/orders.model');

// [GET] Danh sách reviews cho 1 sản phẩm (với pagination)
module.exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      productId: productId,
      status: 'approved',
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({
      productId: productId,
      status: 'approved',
      deleted: false
    });

    // Tính rating trung bình
    const avgRating = await Review.aggregate([
      { $match: { productId: productId, status: 'approved', deleted: false } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    // Đếm số reviews theo rating
    const ratingDistribution = await Review.aggregate([
      { $match: { productId: productId, status: 'approved', deleted: false } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.render('client/pages/products/reviews', {
      reviews: reviews,
      totalReviews: totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      averageRating: avgRating[0]?.averageRating.toFixed(1) || 0,
      ratingCount: avgRating[0]?.count || 0,
      ratingDistribution: ratingDistribution,
      productId: productId
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [GET] Form thêm review
module.exports.addReviewForm = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    
    // Kiểm tra user đã mua sản phẩm này chưa
    const order = await Order.findOne({
      userId: res.locals.user._id,
      'products.productId': productId,
      status: 'finish' // Chỉ cho phép review nếu đã hoàn thành
    });

    res.render('client/pages/products/add-review', {
      product: product,
      verifiedPurchase: !!order,
      productId: productId
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [POST] Tạo review mới
module.exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = res.locals.user._id;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        code: '01',
        message: 'Rating phải từ 1-5'
      });
    }

    // Kiểm tra user đã review sản phẩm này chưa
    const existingReview = await Review.findOne({
      productId: productId,
      userId: userId,
      deleted: false
    });

    if (existingReview) {
      return res.status(400).json({
        code: '02',
        message: 'Bạn đã review sản phẩm này rồi'
      });
    }

    // Kiểm tra verified purchase
    const order = await Order.findOne({
      userId: userId,
      'products.productId': productId,
      status: 'finish'
    });

    let variantText = '';
    if (order && order.products) {
      const p = order.products.find(item => item.productId == productId);
      if (p && p.variantText) variantText = p.variantText;
    }

    const newReview = new Review({
      productId: productId,
      userId: userId,
      userName: res.locals.user.fullName,
      userAvatar: res.locals.user.avatar,
      rating: parseInt(rating),
      title: title,
      comment: comment,
      verifiedPurchase: !!order,
      variantText: variantText,
      images: images || [],
      status: 'pending'
    });

    await newReview.save();

    res.status(200).json({
      code: '00',
      message: 'Review của bạn đã gửi và đang chờ duyệt'
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: '99',
      message: 'Lỗi server'
    });
  }
};

// [PATCH] Update review (của chính user)
module.exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = res.locals.user._id;

    const review = await Review.findById(reviewId);

    if (!review || review.userId != userId) {
      return res.status(403).json({
        code: '01',
        message: 'Bạn không có quyền sửa review này'
      });
    }

    review.rating = rating;
    review.title = title;
    review.comment = comment;
    review.status = 'pending'; // Quay lại pending sau khi update

    await review.save();

    res.status(200).json({
      code: '00',
      message: 'Review đã cập nhật'
    });

  } catch (error) {
    res.status(500).json({ code: '99', message: 'Lỗi' });
  }
};

// [DELETE] Xóa review (của chính user)
module.exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = res.locals.user._id;

    const review = await Review.findById(reviewId);

    if (!review || review.userId != userId) {
      return res.status(403).json({
        code: '01',
        message: 'Bạn không có quyền xóa review này'
      });
    }

    review.deleted = true;
    review.deletedAt = new Date();

    await review.save();

    res.status(200).json({
      code: '00',
      message: 'Review đã xóa'
    });

  } catch (error) {
    res.status(500).json({ code: '99', message: 'Lỗi' });
  }
};

// [PATCH] Đánh dấu review hữu ích
module.exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { type } = req.body; // 'helpful' hoặc 'unhelpful'

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        code: '01',
        message: 'Review không tồn tại'
      });
    }

    if (type === 'helpful') {
      review.helpful += 1;
    } else if (type === 'unhelpful') {
      review.unhelpful += 1;
    }

    await review.save();

    res.status(200).json({
      code: '00',
      message: 'Cảm ơn feedback của bạn'
    });

  } catch (error) {
    res.status(500).json({ code: '99', message: 'Lỗi' });
  }
};

// [ADMIN GET] Danh sách reviews chờ duyệt
module.exports.adminPending = async (req, res) => {
  try {
    const reviews = await Review.find({
      status: 'pending'
    }).sort({ createdAt: -1 });

    const Product = require('../../models/product.model');
    const productIds = [...new Set(reviews.map(r => r.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).select('title').lean();
    
    const reviewsWithProducts = reviews.map(review => {
      const product = products.find(p => review.productId && p._id.toString() === review.productId.toString());
      return {
        ...review.toObject(),
        productTitle: product?.title || 'Sản phẩm'
      };
    });

    res.render('admin/pages/reviews/pending', {
      reviews: reviewsWithProducts,
      title: 'Reviews chờ duyệt'
    });
  } catch (error) {
    console.log('Error in adminPending:', error);
    res.status(500).send('Đã có lỗi xảy ra khi lấy danh sách reviews chờ duyệt.');
  }
};

// [ADMIN PATCH] Duyệt/Từ chối review
module.exports.adminApprove = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body; // 'approved' hoặc 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        code: '01',
        message: 'Status không hợp lệ'
      });
    }

    await Review.updateOne(
      { _id: reviewId },
      { status: status }
    );

    res.status(200).json({
      code: '00',
      message: `Review đã ${status}`
    });

  } catch (error) {
    res.status(500).json({ code: '99', message: 'Lỗi' });
  }
};

// [GET] Tất cả reviews (phục vụ dashboard)
module.exports.adminAll = async (req, res) => {
  try {
    const status = req.query.status || 'approved';
    const reviews = await Review.find({
      status: status
    }).sort({ createdAt: -1 });

    const Product = require('../../models/product.model');
    const productIds = [...new Set(reviews.map(r => r.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).select('title').lean();
    
    const reviewsWithProducts = reviews.map(review => {
      const product = products.find(p => review.productId && p._id.toString() === review.productId.toString());
      return {
        ...review.toObject(),
        productTitle: product?.title || 'Sản phẩm'
      };
    });

    res.render('admin/pages/reviews/all', {
      reviews: reviewsWithProducts,
      title: 'Quản lý reviews',
      currentStatus: status
    });
  } catch (error) {
    console.log('Error in adminAll:', error);
    res.status(500).send('Đã có lỗi xảy ra khi lấy danh sách reviews.');
  }
};
