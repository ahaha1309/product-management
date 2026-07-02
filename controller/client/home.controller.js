const productModel = require('../../models/product.model');
const productCategoryModel = require('../../models/product-category.model');
const articleModel = require('../../models/article.model');
const productHelper = require('../../helper/product');
const flashSaleHelper = require('../../helper/flash-sale');
const cache = require('../../helper/cache');

module.exports.index = async (req, res) => {
  // --- Start Caching Logic ---
  let productFeatured = cache.get('home_featured');
  if (!productFeatured) {
    const raw = await productModel.find({ featured: true, status: 'active', deleted: false }).limit(6).exec();
    productFeatured = await flashSaleHelper.applyFlashSaleToProducts(raw);
    cache.set('home_featured', productFeatured, 300); // 5 mins
  }

  let productNew = cache.get('home_new');
  if (!productNew) {
    const raw = await productModel.find({ status: 'active', deleted: false }).limit(8).sort({ position: "desc" }).exec();
    productNew = await flashSaleHelper.applyFlashSaleToProducts(raw);
    cache.set('home_new', productNew, 300);
  }

  let categories = cache.get('home_categories');
  if (!categories) {
    categories = await productCategoryModel.find({ status: 'active', deleted: false }).sort({ position: "asc" }).limit(12).lean();
    cache.set('home_categories', categories, 3600); // 1 hour
  }

  let flashSaleProducts = cache.get('home_flashsale');
  if (!flashSaleProducts) {
    flashSaleProducts = await flashSaleHelper.getActiveFlashSaleProducts(10);
    cache.set('home_flashsale', flashSaleProducts, 60); // 1 min cache
  }

  let dailyDiscoveryProducts = cache.get('home_discovery');
  if (!dailyDiscoveryProducts) {
    const raw = await productModel.find({ status: 'active', deleted: false }).sort({ updatedAt: "desc" }).limit(18).exec();
    dailyDiscoveryProducts = await flashSaleHelper.applyFlashSaleToProducts(raw);
    cache.set('home_discovery', dailyDiscoveryProducts, 300);
  }
  // --- End Caching Logic ---

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
      
      personalizedProducts = await flashSaleHelper.applyFlashSaleToProducts(recommendedRaw);
    }
  }

  // Fallback if no history or not logged in: use trending/featured
  if (personalizedProducts.length === 0) {
    let fallbackRaw = await productModel.find({ status: 'active', deleted: false, featured: true }).limit(12);
    if (fallbackRaw.length === 0) {
      fallbackRaw = await productModel.find({ status: 'active', deleted: false }).sort({ position: "asc" }).limit(12);
    }
    personalizedProducts = await flashSaleHelper.applyFlashSaleToProducts(fallbackRaw);
  }

  // 7. Most Purchased Products (Có thể bạn cũng thích)
  const topProductAgg = await orderModel.aggregate([
    { $match: { status: 'finish' } },
    { $unwind: "$products" },
    { $group: { _id: "$products.productId", totalQuantity: { $sum: "$products.quantity" } } },
    { $sort: { totalQuantity: -1 } },
    { $limit: 12 }
  ]);
  
  const sortedProductIds = topProductAgg.map(p => p._id);
  
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
  const mostPurchasedProducts = await flashSaleHelper.applyFlashSaleToProducts(mostPurchasedRaw);

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
        
        recentlyViewedProducts = await flashSaleHelper.applyFlashSaleToProducts(orderedRecentlyViewed);
      }
    } catch(e) {}
  }

  const isLogin = res.locals.isLogin || false;
  const seoService = require('../../services/seo.service');
  
  const seoData = seoService.buildMeta({
    title: 'Trang Chủ',
    description: 'NVH Mall - Chuyên phân phối các sản phẩm công nghệ Apple, Samsung cao cấp, chính hãng với giá tốt nhất thị trường.',
    url: 'https://vanhatech.com/',
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "NVH Mall",
        "url": "https://vanhatech.com/",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://vanhatech.com/search?keyword={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "NVH Mall",
        "url": "https://vanhatech.com/",
        "logo": "https://vanhatech.com/image/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+84-1900-1234",
          "contactType": "customer service"
        }
      }
    ]
  });

  let flashSaleEndTime = null;
  if (flashSaleProducts && flashSaleProducts.length > 0 && flashSaleProducts[0].flashSale) {
    flashSaleEndTime = flashSaleProducts[0].flashSale.endDate;
  }

  res.render('client/pages/home/index.pug', {
    title: 'Trang Chủ',
    seoData,
    message: 'Trang chủ',
    isLogin: isLogin,
    productFeatured: productFeatured,
    productNew: productNew,
    categories: categories,
    flashSaleProducts: flashSaleProducts,
    flashSaleEndTime: flashSaleEndTime,
    dailyDiscoveryProducts: dailyDiscoveryProducts,
    personalizedProducts: personalizedProducts,
    mostPurchasedProducts: mostPurchasedProducts,
    latestArticles: latestArticlesRaw,
    recentlyViewedProducts: recentlyViewedProducts
  });
};
