const productModel = require('../../models/product.model');
const productHelper = require('../../helper/product');
module.exports.index = async (req, res) => {
  const productFeatured = await productModel
    .find({ featured: true, status: 'active', deleted: false })
    .limit(6)
    .exec();
  const newProductFeatured = productHelper.productHelper(productFeatured);
  const productNew= await productModel.find({status: 'active', deleted: false }).limit(8).sort({position:"desc"})
  const newProductNew=productHelper.productHelper(productNew);
  const isLogin=req.cookies.token? true:false;
  res.render('client/pages/home/index.pug', {
    title: 'Trang chủ',
    message: 'Trang chủ',
    isLogin:isLogin,
    productFeatured: newProductFeatured,
    productNew:newProductNew
  });
};
