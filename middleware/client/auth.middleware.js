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

module.exports.infoUser = async (req, res, next) => {
  if (req.cookies.token) {
    const user = await userModel.findOne({
      token: req.cookies.token,
      deleted: false,
      status: "active"
    }).select("fullName").lean();
    const cart = await cartModel.findOne({ userId: user._id });
    if(!cart){
      return res.locals.quantityCart=0
    }
    res.locals.quantityCart=cart.products.length;
    res.locals.user = user || null;
    res.locals.isLogin = !!user;

  } else {
    res.locals.user = null;
    res.locals.isLogin = false;
  }

  next();
};