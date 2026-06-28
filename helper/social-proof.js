const Order = require('../models/orders.model');
const Review = require('../models/review.model');
const Product = require('../models/product.model');

/**
 * Lấy thông tin live orders (đơn hàng vừa được tạo)
 */
module.exports.getLiveOrders = async (limit = 5) => {
  try {
    const liveOrders = await Order.find({
      status: { $ne: 'canceled' }
    })
      .select('orderCode userId products amount createdAt status paymentStatus')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const User = require('../models/user.model');
    const userIds = [...new Set(liveOrders.map(o => o.userId).filter(id => id))];
    const users = await User.find({ _id: { $in: userIds } }).select('fullName').lean();

    return liveOrders.map(order => {
      const user = users.find(u => u._id.toString() === order.userId);
      return {
        ...order,
        id: order._id,
        userName: user ? user.fullName : 'Khách vãng lai',
        timeAgo: getTimeAgo(order.createdAt),
        message: `Đơn hàng ${order.amount?.toLocaleString('vi-VN')}đ`
      };
    });

  } catch (error) {
    console.log('Error getting live orders:', error);
    return [];
  }
};

/**
 * Lấy thông tin sản phẩm bán chạy nhất
 */
module.exports.getTopSellingProducts = async (limit = 3, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topSelling = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'canceled' }
        }
      },
      { $unwind: '$products' },
      {
        $addFields: {
          normalizedProductId: { $convert: { input: '$products.productId', to: 'objectId', onError: '$products.productId', onNull: null } }
        }
      },
      {
        $group: {
          _id: '$normalizedProductId',
          totalSold: { $sum: '$products.quantity' },
          orderTitle: { $first: '$products.title' },
          orderThumbnail: { $first: '$products.thumbnail' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);

    const productIds = topSelling.map(item => item._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('title thumbnail price');

    const result = topSelling.map(item => {
      const product = products.find(p => p._id.toString() === item._id.toString());
      return {
        productId: item._id,
        productTitle: product?.title || item.orderTitle,
        thumbnail: product?.thumbnail || item.orderThumbnail,
        sold: item.totalSold,
        message: `${item.totalSold} người đã mua`
      };
    });

    return result;

  } catch (error) {
    console.log('Error getting top selling products:', error);
    return [];
  }
};

/**
 * Lấy reviews mới nhất để hiển thị
 */
module.exports.getLatestReviews = async (limit = 5) => {
  try {
    const reviews = await Review.find({
      status: 'approved',
      deleted: false
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('productId userId userName rating comment createdAt verifiedPurchase')
      .lean();

    // Lấy tên sản phẩm
    const productIds = [...new Set(reviews.map(r => r.productId))];
    const products = await Product.find({ _id: { $in: productIds } })
      .select('title')
      .lean();

    const formatted = reviews.map(review => {
      const product = products.find(p => p._id.toString() === review.productId.toString());
      return {
        id: review._id,
        productTitle: product?.title || 'Sản phẩm',
        userName: review.userName || 'Khách',
        rating: review.rating,
        comment: review.comment?.substring(0, 80),
        verifiedPurchase: review.verifiedPurchase,
        timeAgo: getTimeAgo(review.createdAt)
      };
    });

    return formatted;

  } catch (error) {
    console.log('Error getting latest reviews:', error);
    return [];
  }
};

/**
 * Tính toán thống kê sản phẩm
 */
module.exports.getProductStats = async (productId) => {
  try {
    // Reviews
    const reviews = await Review.find({
      productId: productId,
      status: 'approved',
      deleted: false
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    // Orders
    const orders = await Order.countDocuments({
      'products.productId': productId,
      status: 'finish'
    });

    // Verified purchases
    const verifiedReviews = reviews.filter(r => r.verifiedPurchase).length;

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      totalSold: orders,
      verifiedReviews,
      satisfaction: Math.round((verifiedReviews / totalReviews) * 100) || 0
    };

  } catch (error) {
    console.log('Error getting product stats:', error);
    return null;
  }
};

/**
 * Lấy số liệu thống kê chung
 */
module.exports.getGeneralStats = async () => {
  try {
    const totalOrders = await Order.countDocuments({ status: 'finish' });
    const totalReviews = await Review.countDocuments({ status: 'approved', deleted: false });
    const averageRating = await Review.aggregate([
      { $match: { status: 'approved', deleted: false } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'finish' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const User = require('../models/user.model');
    const Product = require('../models/product.model');
    const totalUsers = await User.countDocuments({ deleted: false });
    const totalProducts = await Product.countDocuments({ deleted: false, status: 'active' });
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

    return {
      totalOrders,
      todayOrders,
      totalUsers,
      totalProducts,
      totalReviews,
      averageRating: averageRating[0]?.avg.toFixed(1) || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    };

  } catch (error) {
    console.log('Error getting general stats:', error);
    return {
      totalOrders: 0,
      totalReviews: 0,
      averageRating: 0,
      totalRevenue: 0
    };
  }
};

/**
 * Widget: Hiển thị % khách hàng hài lòng
 */
module.exports.getSatisfactionRate = async () => {
  try {
    const satisfiedReviews = await Review.countDocuments({
      rating: { $gte: 4 },
      status: 'approved',
      deleted: false
    });

    const totalReviews = await Review.countDocuments({
      status: 'approved',
      deleted: false
    });

    const rate = totalReviews > 0
      ? Math.round((satisfiedReviews / totalReviews) * 100)
      : 0;

    return {
      satisfiedCount: satisfiedReviews,
      totalCount: totalReviews,
      percentage: rate,
      message: `${rate}% khách hàng hài lòng`
    };

  } catch (error) {
    return { percentage: 0, message: 'N/A' };
  }
};

/**
 * Widget: "Sản phẩm được yêu thích"
 */
module.exports.getMostWishlisted = async (limit = 5) => {
  try {
    // Import wishlist model
    const Wishlist = require('../models/wishlist.model');

    // Aggregate tất cả wishlists
    const mostWishlisted = await Wishlist.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    const productIds = mostWishlisted.map(item => item._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('title thumbnail');

    const result = mostWishlisted.map(item => {
      const product = products.find(p => p._id.toString() === item._id.toString());
      return {
        productId: item._id,
        title: product?.title,
        thumbnail: product?.thumbnail,
        wishlisted: item.count
      };
    });

    return result;

  } catch (error) {
    return [];
  }
};

/**
 * Helper: Chuyển đổi thời gian sang format "X giờ trước"
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins}m trước`;
  if (diffHours < 24) return `${diffHours}h trước`;
  if (diffDays < 7) return `${diffDays}d trước`;
  
  return date.toLocaleDateString('vi-VN');
}

module.exports.getTimeAgo = getTimeAgo;
