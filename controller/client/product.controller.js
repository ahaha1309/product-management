const Product = require('../../models/product.model');
const categoryModel=require('../../models/product-category.model')
const productHelper = require('../../helper/product');
const getSubCategoryHelper=require('../../helper/product-category')
const flashSaleHelper = require('../../helper/flash-sale');
module.exports.index = async (req, res) => {
  let sort = {};
  let sortKey='';
  let value='';
  if (req.query.sortKey && req.query.value) {
    sortKey = req.query.sortKey;
    value = req.query.value;
    // Mongoose sort only accepts asc/desc/1/-1. Map 'true' to 'desc' for boolean sort fields.
    sort[sortKey] = value === 'true' ? 'desc' : value;
  } else {
    sort['position'] = 'desc';
  }
  console.log('Mongoose Sort:', sort);
  const product = await Product.find({
    status: 'active',
    deleted: false,
  }).sort(sort);
  
  let newProduct = await flashSaleHelper.applyFlashSaleToProducts(product);

  // Lọc theo khoảng giá (Price Range Filter)
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Infinity;

  if (req.query.minPrice || req.query.maxPrice) {
    newProduct = newProduct.filter(item => {
      const price = parseFloat(item.priceNew);
      return price >= minPrice && price <= maxPrice;
    });
  }

  // Lọc sản phẩm Flash Sale (chỉ lấy những sp giảm sâu >= 15%)
  if (req.query.discount === 'true') {
    newProduct = newProduct.filter(item => item.discountPercentage >= 15);
  }

  // Lọc sản phẩm Dành Riêng Cho Bạn và Gợi Ý Hôm Nay
  if (req.query.filter === 'personalized') {
    const orderModel = require('../../models/orders.model');
    let personalizedIds = [];
    if (res.locals.user) {
      const userId = res.locals.user.id || res.locals.user._id;
      const orders = await orderModel.find({ userId: userId, status: 'finish' }).select('products');
      if (orders.length > 0) {
        const productIds = [];
        orders.forEach(order => {
          order.products.forEach(p => productIds.push(p.productId));
        });
        const boughtProducts = await Product.find({ _id: { $in: productIds } }).select('product_category_id');
        const categoryIds = [...new Set(boughtProducts.map(p => p.product_category_id).filter(id => id))];
        
        const recommendedRaw = await Product.find({
          product_category_id: { $in: categoryIds },
          _id: { $nin: productIds },
          status: 'active',
          deleted: false
        });
        personalizedIds = recommendedRaw.map(p => p._id.toString());
      }
    }
    
    if (personalizedIds.length > 0) {
      newProduct = newProduct.filter(item => personalizedIds.includes(item.id || item._id.toString()));
    } else {
      // Fallback
      const featured = newProduct.filter(item => item.featured === true);
      if (featured.length > 0) {
        newProduct = featured;
      }
    }
  } else if (req.query.filter === 'daily') {
    newProduct.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  // Fetch all categories for sidebar and filter out empty ones
  const categoriesRaw = await categoryModel.find({ status: 'active', deleted: false });
  const activeProductsForCat = await Product.find({ status: 'active', deleted: false }).select('product_category_id');
  const validCatIds = new Set(activeProductsForCat.map(p => p.product_category_id ? p.product_category_id.toString() : null));
  const categories = categoriesRaw.filter(c => validCatIds.has(c._id.toString()));

  // Lọc theo Danh mục (Category Filter) — bao gồm cả category con
  if (req.query.category) {
    const subCats = await getSubCategoryHelper.getSubCategory(req.query.category);
    const subCatIds = subCats.map(c => c.id || c._id.toString());
    const allCatIds = new Set([req.query.category, ...subCatIds]);
    newProduct = newProduct.filter(item => item.product_category_id && allCatIds.has(item.product_category_id.toString()));
  }

  let pageTitle = 'Trang sản phẩm';
  if (req.query.filter === 'personalized') pageTitle = 'Dành Riêng Cho Bạn';
  if (req.query.filter === 'daily') pageTitle = 'Gợi Ý Hôm Nay';

  res.render('client/pages/products/index.pug', {
    title: pageTitle,
    message: pageTitle,
    product: newProduct,
    categories: categories,
    type: sortKey + '-' + value,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    currentCategory: req.query.category,
    currentRating: req.query.rating
  });
};

module.exports.detail=async (req,res)=>{
  const slug=req.params.slug;
  const productVariantModel = require('../../models/product-variant.model');
  const reviewModel = require('../../models/review.model');

  try {
    const productDoc = await Product.findOne({slug:slug});
    if (!productDoc) {
      req.flash('error','Không tồn tại sản phẩm này');
      return res.redirect(`/product`);
    }
    
    let product = productDoc.toObject();

    if(product.product_category_id){
      const category=await categoryModel.findOne({_id:product.product_category_id,status:'active',deleted:false});
      product.category=category;
    }
    const [processedProduct] = await flashSaleHelper.applyFlashSaleToProducts([product]);
    product.newPrice = processedProduct.newPrice;
    product.priceNew = processedProduct.priceNew;
    product.isFlashSale = processedProduct.isFlashSale;
    product.flashSale = processedProduct.flashSale;

    // 1. Fetch Variants
    const variants = await productVariantModel.find({ productId: product._id, status: 'active', isActive: true });
    
    // Process variants to group by attributes for UI
    const attributes = {
      colors: new Set(),
      storages: new Set(),
      sizes: new Set()
    };
    variants.forEach(v => {
      if(v.attributes.color) attributes.colors.add(v.attributes.color);
      if(v.attributes.storage) attributes.storages.add(v.attributes.storage);
      if(v.attributes.size) attributes.sizes.add(v.attributes.size);
    });

    // 2. Fetch Reviews
    const reviews = await reviewModel.find({ productId: product._id.toString(), status: 'approved', deleted: false }).sort({ createdAt: 'desc' });
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
      averageRating = (sum / reviews.length).toFixed(1);
    }

    // 3. Save to Recently Viewed (Cookies)
    let recentlyViewed = [];
    if (req.cookies.recently_viewed) {
      try {
        let cookieVal = req.cookies.recently_viewed;
        if(cookieVal.includes('%')) cookieVal = decodeURIComponent(cookieVal);
        recentlyViewed = JSON.parse(cookieVal);
      } catch(e) {}
    }
    // Add current product to the beginning, remove duplicates, keep max 12
    recentlyViewed = recentlyViewed.filter(id => id !== product._id.toString());
    recentlyViewed.unshift(product._id.toString());
    if (recentlyViewed.length > 12) recentlyViewed = recentlyViewed.slice(0, 12);
    res.cookie('recently_viewed', JSON.stringify(recentlyViewed), { maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' }); // 30 days

    let isWishlisted = false;
    if (res.locals.user) {
      const wishlistModel = require('../../models/wishlist.model');
      const userId = res.locals.user._id || res.locals.user.id;
      
      const wishlist = await wishlistModel.findOne({ userId: userId.toString() });
      let fallback = null;
      
      if (!wishlist) {
        // Fallback check if it was saved as ObjectId somehow
        fallback = await wishlistModel.findOne({ userId: userId });
        if (fallback && fallback.products && fallback.products.some(p => p.productId && p.productId.toString() === product._id.toString())) {
          isWishlisted = true;
        }
      } else if (wishlist && wishlist.products && wishlist.products.some(p => p.productId && p.productId.toString() === product._id.toString())) {
        isWishlisted = true;
      }
      console.log('DEBUG WISHLIST:', { 
        userId: userId.toString(), 
        productId: product._id.toString(), 
        wishlistFound: !!(wishlist || fallback), 
        isWishlisted 
      });
      res.locals.debugWishlist = JSON.stringify({
        userId: userId.toString(),
        productId: product._id.toString(),
        wishlistFound: !!(wishlist || fallback),
        isWishlisted,
        productsInWishlist: (wishlist || fallback || {products:[]}).products.map(p => p.productId)
      });
    }

    // 4. Fetch Questions
    const questionModel = require('../../models/question.model');
    const questions = await questionModel.find({ productId: product._id, status: 'approved', deleted: false })
      .populate('userId', 'fullName avatar')
      .populate('answers.userId', 'fullName avatar')
      .sort({ createdAt: 'desc' });

    // 5. Fetch Related Products
    const relatedProductsRaw = await Product.find({
      product_category_id: product.product_category_id,
      _id: { $ne: product._id },
      status: 'active',
      deleted: false
    }).limit(6);
    const relatedProducts = await flashSaleHelper.applyFlashSaleToProducts(relatedProductsRaw);

    // 6. Fetch Recently Viewed Products
    let recentlyViewedProductsRaw = [];
    if (recentlyViewed.length > 1) { // >1 because the first one is the current product
      const recentIds = recentlyViewed.slice(1, 7); // Show max 6 others
      recentlyViewedProductsRaw = await Product.find({
        _id: { $in: recentIds },
        status: 'active',
        deleted: false
      });
      // Sort to maintain recently viewed order
      recentlyViewedProductsRaw.sort((a, b) => recentIds.indexOf(a._id.toString()) - recentIds.indexOf(b._id.toString()));
    }
    const recentlyViewedProducts = await flashSaleHelper.applyFlashSaleToProducts(recentlyViewedProductsRaw);

    const seoService = require('../../services/seo.service');
    const seoData = seoService.buildMeta({
      title: product.title,
      description: product.description ? product.description.replace(/(<([^>]+)>)/gi, '').substring(0, 160) : `Mua ${product.title} chính hãng tại NVH Mall. Giá tốt, giao hàng toàn quốc.`,
      url: `https://vanhatech.com/product/detail/${product.slug}`,
      image: product.thumbnail,
      type: 'product',
      jsonLd: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "image": [product.thumbnail],
        "description": product.description ? product.description.replace(/(<([^>]+)>)/gi, '').substring(0, 160) : '',
        "sku": product._id.toString(),
        "brand": {
          "@type": "Brand",
          "name": "NVH Mall"
        },
        "offers": {
          "@type": "Offer",
          "url": `https://vanhatech.com/product/detail/${product.slug}`,
          "priceCurrency": "VND",
          "price": product.newPrice || product.price,
          "priceValidUntil": "2026-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      }
    });

    res.render('client/pages/products/detail', {
      title: product.title,
      seoData: seoData,
      product: product,
      variants: variants,
      variantAttributes: {
        colors: Array.from(attributes.colors),
        storages: Array.from(attributes.storages),
        sizes: Array.from(attributes.sizes)
      },
      reviews: reviews,
      averageRating: averageRating,
      isWishlisted: isWishlisted,
      questions: questions,
      relatedProducts: relatedProducts,
      recentlyViewedProducts: recentlyViewedProducts
    });
  } catch (error) {
    req.flash('error','Lỗi khi tải chi tiết sản phẩm');
    res.redirect(`/product`);
  }
}
module.exports.getProductsByCategory = async (req, res) => {
  const slugCategory = req.params.slug;

  try {
    const category = await categoryModel.findOne({ slug: slugCategory, deleted: false });
    if (!category) {
      return res.redirect('/product');
    }

    const listSubCategory = await getSubCategoryHelper.getSubCategory(category._id);
    const listSubCategoryId = listSubCategory.map(item => item.id);

    // Lấy sản phẩm thuộc category này VÀ tất cả category con (đệ quy)
    const products = await Product.find({
      product_category_id: { $in: [category._id.toString(), ...listSubCategoryId] },
      status: 'active',
      deleted: false,
    });

    const newProduct = await flashSaleHelper.applyFlashSaleToProducts(products);

    // Lấy danh sách categories cho sidebar
    const categoriesRaw = await categoryModel.find({ status: 'active', deleted: false });
    const activeProductsForCat = await Product.find({ status: 'active', deleted: false }).select('product_category_id');
    const validCatIds = new Set(activeProductsForCat.map(p => p.product_category_id ? p.product_category_id.toString() : null));
    const categories = categoriesRaw.filter(c => validCatIds.has(c._id.toString()));

    res.render('client/pages/products/index', {
      title: category.title,
      metaDesc: `Danh sách sản phẩm ${category.title} chính hãng, giá cực sốc tại NVH Mall. Mua ngay hôm nay để nhận ưu đãi hấp dẫn.`,
      product: newProduct,
      categories: categories,
      currentCategory: category._id.toString(),
      type: '',
      minPrice: undefined,
      maxPrice: undefined,
      currentRating: undefined,
    });

  } catch (e) {
    console.log(e);
    return res.redirect('/product');
  }
};