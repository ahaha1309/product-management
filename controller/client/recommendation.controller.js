const Product = require('../../models/product.model');
const Review = require('../../models/review.model');
const Order = require('../../models/orders.model');
const Wishlist = require('../../models/wishlist.model');
const Category = require('../../models/product-category.model');
const productHelper = require('../../helper/product');

// [GET] Sản phẩm gợi ý dựa trên hành vi xem
module.exports.personalizedRecommendations = async (req, res) => {
  try {
    const userId = res.locals.user?._id;
    const sessionId = req.sessionID;

    // Lấy danh sách sản phẩm đã xem (từ cookie hoặc session)
    const viewedProducts = req.session.viewedProducts || [];
    const recentlyViewed = await Product.find({
      _id: { $in: viewedProducts.slice(-5) }
    });

    // Lấy categories từ các sản phẩm đã xem
    const categories = [...new Set(recentlyViewed.map(p => p.product_category_id))];

    // Gợi ý sản phẩm từ cùng category
    const recommendations = await Product.find({
      product_category_id: { $in: categories },
      _id: { $nin: viewedProducts },
      status: 'active',
      deleted: false
    })
      .limit(6)
      .sort({ featured: -1, position: -1 });

    const newRecommendations = productHelper.productHelper(recommendations);

    res.status(200).json({
      code: '00',
      recommendations: newRecommendations
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [GET] Sản phẩm liên quan (dựa trên category, tags, price range)
module.exports.relatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 3;

    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      return res.status(404).json({
        code: '01',
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Tìm sản phẩm trong cùng category với giá tương tự
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      product_category_id: currentProduct.product_category_id,
      price: {
        $gte: currentProduct.price * 0.7,
        $lte: currentProduct.price * 1.3
      },
      status: 'active',
      deleted: false
    })
      .limit(limit)
      .sort({ featured: -1, position: -1 });

    const newRelated = productHelper.productHelper(relatedProducts);

    // Thêm rating
    for (const product of newRelated) {
      const avgRating = await Review.aggregate([
        { $match: { productId: product._id.toString(), status: 'approved' } },
        { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      product.rating = avgRating[0]?.averageRating.toFixed(1) || 0;
      product.reviewCount = avgRating[0]?.count || 0;
    }

    res.status(200).json({
      code: '00',
      relatedProducts: newRelated
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [GET] Sản phẩm "Customers Also Bought"
module.exports.customersAlsoBought = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // Tìm tất cả đơn hàng chứa sản phẩm này
    const ordersWithProduct = await Order.find({
      'products.productId': productId,
      status: 'finish'
    }).select('products');

    // Lấy danh sách các sản phẩm khác từ những đơn hàng đó
    const otherProducts = new Map();

    for (const order of ordersWithProduct) {
      for (const product of order.products) {
        if (product.productId !== productId) {
          otherProducts.set(product.productId, 
            (otherProducts.get(product.productId) || 0) + 1
          );
        }
      }
    }

    // Sắp xếp theo tần suất và lấy top
    const topProducts = Array.from(otherProducts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const alsoBought = await Product.find({
      _id: { $in: topProducts },
      status: 'active',
      deleted: false
    });

    const newAlsoBought = productHelper.productHelper(alsoBought);

    res.status(200).json({
      code: '00',
      alsoBought: newAlsoBought
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [GET] Trending Products (sản phẩm bán chạy nhất)
module.exports.trendingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const days = parseInt(req.query.days) || 30;

    // Tìm đơn hàng trong X ngày qua
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentOrders = await Order.find({
      createdAt: { $gte: startDate },
      status: 'finish'
    }).select('products');

    // Đếm tần suất bán
    const salesCount = new Map();

    for (const order of recentOrders) {
      for (const product of order.products) {
        salesCount.set(product.productId,
          (salesCount.get(product.productId) || 0) + product.quantity
        );
      }
    }

    // Lấy top products
    const topProductIds = Array.from(salesCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const trending = await Product.find({
      _id: { $in: topProductIds },
      status: 'active',
      deleted: false
    });

    const newTrending = productHelper.productHelper(trending);

    res.status(200).json({
      code: '00',
      trending: newTrending
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [GET] Best Rated Products
module.exports.bestRated = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    // Aggregation để lấy sản phẩm có rating cao nhất
    const bestRated = await Review.aggregate([
      {
        $match: { status: 'approved', deleted: false }
      },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      },
      {
        $match: { reviewCount: { $gte: 5 } } // Chỉ lấy sản phẩm có ít nhất 5 reviews
      },
      {
        $sort: { averageRating: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Lấy chi tiết sản phẩm
    const productIds = bestRated.map(item => item._id);
    const products = await Product.find({
      _id: { $in: productIds },
      status: 'active',
      deleted: false
    });

    const newProducts = productHelper.productHelper(products);

    // Thêm rating info
    for (const product of newProducts) {
      const rating = bestRated.find(item => item._id.toString() === product._id.toString());
      product.rating = rating?.averageRating.toFixed(1) || 0;
      product.reviewCount = rating?.reviewCount || 0;
    }

    res.status(200).json({
      code: '00',
      bestRated: newProducts
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [POST] Track product view (lưu vào session)
module.exports.trackView = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!req.session.viewedProducts) {
      req.session.viewedProducts = [];
    }

    // Thêm nếu chưa có, hoặc move to end nếu đã có
    const index = req.session.viewedProducts.indexOf(productId);
    if (index > -1) {
      req.session.viewedProducts.splice(index, 1);
    }

    req.session.viewedProducts.push(productId);

    // Giữ tối đa 20 sản phẩm
    if (req.session.viewedProducts.length > 20) {
      req.session.viewedProducts.shift();
    }

    res.status(200).json({
      code: '00',
      message: 'Tracked'
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};

// [GET] Recently Viewed (từ session)
module.exports.recentlyViewed = async (req, res) => {
  try {
    const viewedProducts = req.session.viewedProducts || [];
    const limit = parseInt(req.query.limit) || 5;

    const products = await Product.find({
      _id: { $in: viewedProducts.slice(-limit) },
      status: 'active',
      deleted: false
    });

    const newProducts = productHelper.productHelper(products);

    res.status(200).json({
      code: '00',
      recentlyViewed: newProducts
    });

  } catch (error) {
    res.status(500).json({
      code: '99',
      message: 'Lỗi'
    });
  }
};
