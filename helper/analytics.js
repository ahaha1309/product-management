const Order = require('../models/orders.model');
const Product = require('../models/product.model');
const Review = require('../models/review.model');
const User = require('../models/user.model');

/**
 * Dashboard Analytics - Tổng quan
 */
module.exports.getDashboardOverview = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Tổng doanh thu
    const totalRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'finish' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Số đơn hàng
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate },
      status: 'finish'
    });

    // Số sản phẩm bán
    const totalProductsSold = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'finish' } },
      { $unwind: '$products' },
      { $group: { _id: null, total: { $sum: '$products.quantity' } } }
    ]);

    // Số khách mới
    const newCustomers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Average order value
    const avgOrderValue = totalOrders > 0
      ? Math.round((totalRevenue[0]?.total || 0) / totalOrders)
      : 0;

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalProductsSold: totalProductsSold[0]?.total || 0,
      newCustomers,
      avgOrderValue,
      period: days
    };

  } catch (error) {
    console.log('Error getting dashboard overview:', error);
    return null;
  }
};

/**
 * Revenue trend (theo ngày trong tháng)
 */
module.exports.getRevenueTrend = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'finish' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return trend;

  } catch (error) {
    console.log('Error getting revenue trend:', error);
    return [];
  }
};

/**
 * Top categories (sản phẩm bán chạy nhất theo danh mục)
 */
module.exports.getTopCategories = async (limit = 10, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topCategories = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'finish' } },
      { $unwind: '$products' },
      {
        $addFields: {
          productObjId: { $toObjectId: '$products.productId' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productObjId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.product_category_id',
          quantity: { $sum: '$products.quantity' },
          revenue: { $sum: { $multiply: ['$product.price', '$products.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $addFields: {
          categoryObjId: { 
            $cond: { 
              if: { $and: [{ $ne: ['$_id', null] }, { $ne: ['$_id', ''] }] }, 
              then: { $toObjectId: '$_id' }, 
              else: null 
            } 
          }
        }
      },
      {
        $lookup: {
          from: 'product-category',
          localField: 'categoryObjId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $addFields: {
          categoryTitle: { $arrayElemAt: ['$category.title', 0] }
        }
      }
    ]);

    return topCategories;

  } catch (error) {
    console.log('Error getting top categories:', error);
    return [];
  }
};

/**
 * Payment status breakdown
 */
module.exports.getPaymentStatusBreakdown = async () => {
  try {
    const breakdown = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    return breakdown;

  } catch (error) {
    return [];
  }
};

/**
 * Customer metrics
 */
module.exports.getCustomerMetrics = async () => {
  try {
    const totalCustomers = await User.countDocuments({ deleted: false });

    // Khách mới trong 30 ngày
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomersMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      deleted: false
    });

    // Repeat customers
    const repeatCustomers = await Order.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);

    // Average orders per customer
    const avgOrdersPerCustomer = await Order.aggregate([
      { $group: { _id: '$userId' } },
      { $group: { _id: null, avg: { $sum: 1 } } }
    ]);

    const totalOrders = await Order.countDocuments();

    return {
      totalCustomers,
      newCustomersMonth,
      repeatCustomers: repeatCustomers[0]?.total || 0,
      repeatRate: totalCustomers > 0 
        ? Math.round(((repeatCustomers[0]?.total || 0) / totalCustomers) * 100)
        : 0,
      avgOrdersPerCustomer: totalCustomers > 0
        ? (totalOrders / totalCustomers).toFixed(2)
        : 0
    };

  } catch (error) {
    return null;
  }
};

/**
 * Review analytics
 */
module.exports.getReviewAnalytics = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Tổng reviews
    const totalReviews = await Review.countDocuments({
      createdAt: { $gte: startDate },
      deleted: false
    });

    // Reviews đã duyệt
    const approvedReviews = await Review.countDocuments({
      createdAt: { $gte: startDate },
      status: 'approved',
      deleted: false
    });

    // Average rating
    const avgRating = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'approved',
          deleted: false
        }
      },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    // Rating distribution
    const ratingDist = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'approved',
          deleted: false
        }
      },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    return {
      totalReviews,
      approvedReviews,
      pendingReviews: totalReviews - approvedReviews,
      averageRating: avgRating[0]?.avg.toFixed(1) || 0,
      ratingDistribution: ratingDist.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

  } catch (error) {
    return null;
  }
};

/**
 * Product performance
 */
module.exports.getProductPerformance = async (limit = 10, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performance = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'finish' } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          sold: { $sum: '$products.quantity' },
          revenue: { $sum: '$products.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $addFields: {
          productObjId: { $toObjectId: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productObjId',
          foreignField: '_id',
          as: 'product'
        }
      }
    ]);

    return performance;

  } catch (error) {
    return [];
  }
};

/**
 * Conversion funnel analysis
 */
module.exports.getConversionFunnel = async () => {
  try {
    const totalVisitors = await User.countDocuments(); // Giả định = visitors
    const totalProductViews = 0; // TODO: Implement tracking
    const addedToCart = await Order.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    const completedOrders = await Order.countDocuments({ status: 'finish' });

    return {
      visitors: totalVisitors,
      productViews: totalProductViews,
      cart: addedToCart[0]?.count || 0,
      completed: completedOrders,
      conversionRate: totalVisitors > 0
        ? Math.round((completedOrders / totalVisitors) * 100)
        : 0
    };

  } catch (error) {
    return null;
  }
};
