const productModel = require('../../models/product.model');
const productCategoryModel = require('../../models/product-category.model');
const articleModel = require('../../models/article.model');
const productHelper = require('../../helper/product');

module.exports.index = async (req, res) => {
  // 1. Featured Products
  const productFeaturedRaw = await productModel
    .find({ featured: true, status: 'active', deleted: false })
    .limit(6)
    .exec();
  const productFeatured = productHelper.productHelper(productFeaturedRaw);

  // 2. New Products
  const productNewRaw = await productModel
    .find({ status: 'active', deleted: false })
    .limit(8)
    .sort({ position: "desc" });
  const productNew = productHelper.productHelper(productNewRaw);

  // 3. Categories for Grid
  const categories = await productCategoryModel
    .find({ status: 'active', deleted: false })
    .sort({ position: "asc" })
    .limit(12);

  // 4. Flash Sale (Simulation: Highest discount products)
  const flashSaleProductsRaw = await productModel
    .find({ status: 'active', deleted: false, discountPercentage: { $gte: 15 } })
    .sort({ discountPercentage: "desc" })
    .limit(10)
    .exec();
  const flashSaleProducts = productHelper.productHelper(flashSaleProductsRaw);

  // 5. Daily Discovery / Gợi ý hôm nay
  const dailyDiscoveryRaw = await productModel
    .find({ status: 'active', deleted: false })
    .sort({ updatedAt: "desc" }) // Or random, but let's use recent updates
    .limit(18)
    .exec();
  const dailyDiscoveryProducts = productHelper.productHelper(dailyDiscoveryRaw);

  // 6. Personalized Recommendations (Dành Riêng Cho Bạn)
  const orderModel = require('../../models/orders.model');
  let personalizedProducts = [];
  
  if (res.locals.user) {
    const userId = res.locals.user.id || res.locals.user._id;
    // Get user's finished orders
    const orders = await orderModel.find({ userId: userId, status: 'finish' }).select('products');
    
    if (orders.length > 0) {
      // Extract product IDs
      const productIds = [];
      orders.forEach(order => {
        order.products.forEach(p => productIds.push(p.productId));
      });
      
      // Get categories of these products
      const boughtProducts = await productModel.find({ _id: { $in: productIds } }).select('product_category_id');
      const categoryIds = [...new Set(boughtProducts.map(p => p.product_category_id).filter(id => id))];
      
      // Find new products in these categories that user hasn't bought
      const recommendedRaw = await productModel.find({
        product_category_id: { $in: categoryIds },
        _id: { $nin: productIds },
        status: 'active',
        deleted: false
      }).limit(12).sort({ position: "desc" });
      
      personalizedProducts = productHelper.productHelper(recommendedRaw);
    }
  }

  // Fallback if no history or not logged in: use trending/featured
  if (personalizedProducts.length === 0) {
    let fallbackRaw = await productModel.find({ status: 'active', deleted: false, featured: true }).limit(12);
    if (fallbackRaw.length === 0) {
      fallbackRaw = await productModel.find({ status: 'active', deleted: false }).sort({ position: "asc" }).limit(12);
    }
    personalizedProducts = productHelper.productHelper(fallbackRaw);
  }

  // 7. Most Purchased Products (Có thể bạn cũng thích)
  const allOrders = await orderModel.find({ status: 'finish' }).select('products');
  let productFrequency = {};
  allOrders.forEach(order => {
    order.products.forEach(p => {
      productFrequency[p.productId] = (productFrequency[p.productId] || 0) + p.quantity;
    });
  });
  
  // Sort by frequency
  let sortedProductIds = Object.keys(productFrequency).sort((a, b) => productFrequency[b] - productFrequency[a]).slice(0, 12);
  
  let mostPurchasedRaw = [];
  if (sortedProductIds.length > 0) {
    const validIds = sortedProductIds.filter(id => id && id !== 'undefined');
    if (validIds.length > 0) {
      mostPurchasedRaw = await productModel.find({ _id: { $in: validIds }, status: 'active', deleted: false });
    }
  }
  
  if (mostPurchasedRaw.length === 0) {
    // Fallback if no valid orders exist yet
    mostPurchasedRaw = await productModel.find({ status: 'active', deleted: false }).sort({ position: "desc" }).limit(12);
  }
  const mostPurchasedProducts = productHelper.productHelper(mostPurchasedRaw);

  // 8. Latest Articles
  const latestArticlesRaw = await articleModel
    .find({ status: 'active', deleted: false })
    .sort({ position: "desc" })
    .limit(4);

  // 9. Recently Viewed Products
  let recentlyViewedProducts = [];
  if (req.cookies.recently_viewed) {
    try {
      let cookieVal = req.cookies.recently_viewed;
      if(cookieVal.includes('%')) cookieVal = decodeURIComponent(cookieVal);
      const recentlyViewedIds = JSON.parse(cookieVal);
      if (recentlyViewedIds && recentlyViewedIds.length > 0) {
        const recentlyViewedRaw = await productModel.find({
          _id: { $in: recentlyViewedIds },
          status: 'active',
          deleted: false
        });
        
        // Ensure they maintain the order of the cookie (most recent first)
        const orderedRecentlyViewed = recentlyViewedIds.map(id => 
          recentlyViewedRaw.find(p => p._id.toString() === id)
        ).filter(p => p); // Remove any nulls if product deleted
        
        recentlyViewedProducts = productHelper.productHelper(orderedRecentlyViewed);
      }
    } catch(e) {}
  }

  const isLogin = req.cookies.token ? true : false;

  res.render('client/pages/home/index.pug', {
    title: 'Trang chủ',
    message: 'Trang chủ',
    isLogin: isLogin,
    productFeatured: productFeatured,
    productNew: productNew,
    categories: categories,
    flashSaleProducts: flashSaleProducts,
    dailyDiscoveryProducts: dailyDiscoveryProducts,
    personalizedProducts: personalizedProducts,
    mostPurchasedProducts: mostPurchasedProducts,
    latestArticles: latestArticlesRaw,
    recentlyViewedProducts: recentlyViewedProducts
  });
};
