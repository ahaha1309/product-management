const productModel=require('../../models/product.model')
module.exports.search = async (req, res) => {
  const keyword = req.query.keyword || '';

  const regex=new RegExp(keyword,'i')

  const searchProduct = await productModel.find({
    deleted: false,
    title:regex,
    status:'active'
  });

  res.render('client/pages/products/index', {
    title: `Sản phẩm tìm kiếm`,
    product: searchProduct,
    keyword: keyword,
  });
};