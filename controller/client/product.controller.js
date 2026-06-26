const Product = require('../../models/product.model');
const categoryModel=require('../../models/product-category.model')
const productHelper = require('../../helper/product');
const getSubCategoryHelper=require('../../helper/product-category')
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
  
  let newProduct = productHelper.productHelper(product);

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

  // Lọc theo Danh mục (Category Filter)
  if (req.query.category) {
    newProduct = newProduct.filter(item => item.product_category_id && item.product_category_id.toString() === req.query.category);
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
    const product = await Product.findOne({slug:slug});
    if (!product) {
      req.flash('error','Không tồn tại sản phẩm này');
      return res.redirect(`/product`);
    }

    if(product.product_category_id){
      const category=await categoryModel.findOne({_id:product.product_category_id,status:'active',deleted:false});
      product.category=category;
    }
    product.newPrice=productHelper.priceNewProduct(product);

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
      const wishlist = await wishlistModel.findOne({ userId: res.locals.user._id.toString() });
      if (!wishlist) {
        // Fallback check if it was saved as ObjectId somehow
        const fallback = await wishlistModel.findOne({ userId: res.locals.user._id });
        if (fallback && fallback.products && fallback.products.some(p => p.productId && p.productId.toString() === product._id.toString())) {
          isWishlisted = true;
        }
      } else if (wishlist && wishlist.products && wishlist.products.some(p => p.productId && p.productId.toString() === product._id.toString())) {
        isWishlisted = true;
      }
      console.log('DEBUG WISHLIST:', { 
        userId: res.locals.user._id.toString(), 
        productId: product._id.toString(), 
        wishlistFound: !!(wishlist || fallback), 
        isWishlisted 
      });
      res.locals.debugWishlist = JSON.stringify({
        userId: res.locals.user._id.toString(),
        productId: product._id.toString(),
        wishlistFound: !!(wishlist || fallback),
        isWishlisted,
        productsInWishlist: (wishlist || fallback || {products:[]}).products.map(p => p.productId)
      });
    }

    res.render('client/pages/products/detail', {
      title: product.title,
      product: product,
      variants: variants,
      variantAttributes: {
        colors: Array.from(attributes.colors),
        storages: Array.from(attributes.storages),
        sizes: Array.from(attributes.sizes)
      },
      reviews: reviews,
      averageRating: averageRating,
      isWishlisted: isWishlisted
    });    
  } catch (error) {
    req.flash('error','Lỗi khi tải chi tiết sản phẩm');
    res.redirect(`/product`);
  }
}
module.exports.getProductsByCategory = async (req, res) => {
  const slugCategory = req.params.slug;

  try {
    const category = await categoryModel.findOne({ slug: slugCategory });
    const listSubCategory=await getSubCategoryHelper.getSubCategory(category._id)
    const listSubCategoryId=listSubCategory.map(item=>item.id)
    // lấy category con đúng
    const products= await Product.find({
      product_category_id: {$in:[category._id,...listSubCategoryId]}
    });
    const newProduct=productHelper.productHelper(products)
    res.render('client/pages/products/index', {
      title: `Sản phẩm ${category.title}`,
      product: newProduct,
    });

  } catch (e) {
    console.log(e);
    return res.redirect('/product');
  }
};