const mongoose = require('mongoose');
const categoryModel = require('./models/product-category.model');
const productModel = require('./models/product.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const keyword = 'mỹ phẩm';
  const keywordLower = keyword.toLowerCase();
  const synonymMap = {
    'mỹ phẩm': ['son', 'kem', 'dưỡng', 'phấn', 'mặt nạ', 'serum', 'trang điểm'],
  };
  let searchTerms = [keyword];
  for (const [key, synonyms] of Object.entries(synonymMap)) {
    if (keywordLower.includes(key)) {
      searchTerms = searchTerms.concat(synonyms);
    }
  }
  const regexes = searchTerms.map(term => new RegExp(term, 'i'));
  const matchedCategories = await categoryModel.find({ deleted: false, status: 'active', $or: [{ title: { $in: regexes } }] });
  console.log('Categories:', matchedCategories.map(c => c.title));
  
  const categoryIds = matchedCategories.map(cat => cat._id.toString());
  const searchProduct = await productModel.find({
    deleted: false,
    status: 'active',
    $or: [
      { title: { $in: regexes } },
      { product_category_id: { $in: categoryIds } }
    ]
  });
  console.log('Products:', searchProduct.map(p => p.title));
  process.exit(0);
});
