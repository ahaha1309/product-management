const Product = require('../../models/product.model');
module.exports.index = async (req, res) => {
  const product = await Product.find({
    status: 'active',
    deleted: false,
  }).sort({ position: "desc" });
  const newProduct = product.map((item) => {
    item.priceNew = ((item.price * (100 - item.discountPercentage)) / 100).toFixed(0);
    return item;
  });
  res.render('client/pages/products/index.pug', {
    title: 'Trang sản phẩm',
    message: 'Trang sản phẩm',
    product: newProduct,
  });
};

module.exports.detail=async (req,res)=>{
  const slug=req.params.slug;
  try {
  const product=await Product.findOne({slug:slug})
  res.render('client/pages/products/detail', {
    title: product.title,
    product:product
  });    
  } catch (error) {
    req.flash('error','Không tồn tại sản phẩm này')
    // res.redirect(`/product`)
  }
}