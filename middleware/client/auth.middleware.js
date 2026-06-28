const userModel = require('../../models/user.model');
const cartModel = require('../../models/cart.model');
module.exports.requireAuth =async (req, res, next) => {
  if (!req.cookies.token) {
    req.session.returnTo = req.originalUrl;
    return res.redirect(`/auth/login`);
  }
  const userExist= await userModel.findOne({
    token: req.cookies.token
  }).select('-password');
  if (!userExist) {
    req.session.returnTo = req.originalUrl;
    return res.redirect(`/auth/login`);
  }
  next();
};

const wishlistModel = require('../../models/wishlist.model');

module.exports.infoUser = async (req, res, next) => {
  if (req.cookies.token) {
    const user = await userModel.findOne({
      token: req.cookies.token,
      deleted: false,
      status: "active"
    }).select("-password -confirmPassword -token").lean();
    if(!user){
      return next()
    }
    const cart = await cartModel.findOne({ userId: user._id.toString() });
    if(!cart){
      res.locals.quantityCart=0;
    } else {
      res.locals.quantityCart=cart.products.length;
    }

    try {
      const wishlist = await wishlistModel.findOne({ userId: user._id.toString() });
      if (!wishlist) {
        res.locals.quantityWishlist = -1; // -1 means not found
      } else {
        const Product = require('../../models/product.model');
        const validCount = await Product.countDocuments({
          _id: { $in: wishlist.products.map(item => item.productId) },
          deleted: false,
          status: "active"
        });
        res.locals.quantityWishlist = validCount;
      }
    } catch (err) {
      console.error(err);
      res.locals.quantityWishlist = -99; // -99 means crash
    }

    res.locals.user = user || null;
    res.locals.isLogin = !!user;

  } else {
    res.locals.user = null;
    res.locals.isLogin = false;
  }

  next();
};