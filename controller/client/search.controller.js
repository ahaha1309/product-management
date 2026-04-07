const productModel=require('../../models/product.model')
const productHelper=require('../../helper/product')
module.exports.search = async (req, res) => {
  const keyword = req.query.keyword || '';

  const regex=new RegExp(keyword,'i')

  const searchProduct = await productModel.find({
    deleted: false,
    title:regex,
    status:'active'
  });
  const newProduct=productHelper.productHelper(searchProduct)
  res.render('client/pages/products/index', {
    title: `Sản phẩm tìm kiếm`,
    product: newProduct,
    keyword: keyword,
  });
};