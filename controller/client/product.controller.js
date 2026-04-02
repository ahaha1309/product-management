const Product = require('../../models/product.model');
const categoryModel=require('../../models/product-category.model')
const productHelper = require('../../helper/product');
const getSubCategoryHelper=require('../../helper/product-category')
module.exports.index = async (req, res) => {
  const product = await Product.find({
    status: 'active',
    deleted: false,
  }).sort({ position: "desc" });
  const newProduct = productHelper.productHelper(product);
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
  if(product.product_category_id){
    const category=await categoryModel.findOne({_id:product.product_category_id,status:'active',deleted:false});
    product.category=category;
  }
  product.newPrice=productHelper.priceNewProduct(product)
  res.render('client/pages/products/detail', {
    title: product.title,
    product:product,
  });    
  } catch (error) {
    req.flash('error','Không tồn tại sản phẩm này')
    // res.redirect(`/product`)
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
    res.render('client/pages/products/index', {
      title: `Sản phẩm ${category.title}`,
      product: products,
    });

  } catch (e) {
    console.log(e);
    return res.redirect('/product');
  }
};