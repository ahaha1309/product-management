const productModel = require('../../models/product.model');
const categoryModel = require('../../models/product-category.model');
const productHelper = require('../../helper/product');

module.exports.search = async (req, res) => {
  const keyword = req.query.keyword || '';
  const keywordLower = keyword.toLowerCase();

  // 1. Simple Synonym Dictionary
  const synonymMap = {
    'mỹ phẩm': ['son', 'kem', 'dưỡng', 'phấn', 'mặt nạ', 'serum', 'trang điểm'],
    'điện thoại': ['iphone', 'samsung', 'oppo', 'xiaomi', 'smartphone'],
    'máy tính': ['laptop', 'pc', 'macbook', 'dell', 'hp', 'asus'],
    'quần áo': ['áo', 'quần', 'váy', 'đầm', 'thời trang'],
    'giày': ['sneaker', 'giày thể thao', 'giày da', 'boot'],
  };

  let searchTerms = [keyword];
  for (const [key, synonyms] of Object.entries(synonymMap)) {
    if (keywordLower.includes(key)) {
      searchTerms = searchTerms.concat(synonyms);
    }
  }

  // Create regexes for all terms
  const regexes = searchTerms.map(term => new RegExp(term, 'i'));

  // 2. Search Categories matching the keyword or synonyms
  const matchedCategories = await categoryModel.find({
    deleted: false,
    status: 'active',
    $or: [
      { title: { $in: regexes } }
    ]
  });
  const categoryIds = matchedCategories.map(cat => cat._id.toString());

  // 3. Build Product Query
  // Match title OR description OR product_category_id
  const searchProduct = await productModel.find({
    deleted: false,
    status: 'active',
    $or: [
      { title: { $in: regexes } },
      { description: { $in: regexes } },
      { product_category_id: { $in: categoryIds } }
    ]
  });

  const newProduct = productHelper.productHelper(searchProduct);
  
  res.render('client/pages/products/index.pug', {
    title: `Kết quả tìm kiếm cho "${keyword}"`,
    product: newProduct,
    keyword: keyword,
  });
};