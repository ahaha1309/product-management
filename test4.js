const mongoose = require('mongoose');
const productModel = require('./models/product.model');
const categoryModel = require('./models/product-category.model');
require('dotenv').config();

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const synonyms = {
    'my pham': ['son', 'kem', 'duong', 'phan', 'mat na', 'serum', 'trang diem'],
  };
  let regexConditions = [];
  const key = 'my pham';
  const synonymList = [key, ...synonyms[key]].map(k => escapeRegExp(k.replace(/ /g, '-')));
  const synonymRegexPattern = synonymList.join('|');
  regexConditions.push({ slug: new RegExp(`(^|-)(${synonymRegexPattern})(-|$)`, 'i') });

  const categoryQuery = { deleted: false, status: 'active', $and: regexConditions };
  const matchedCategories = await categoryModel.find(categoryQuery);
  const categoryIds = matchedCategories.map(cat => cat._id.toString());
  console.log('Category IDs:', categoryIds, matchedCategories.map(c => c.title));

  const searchProduct = await productModel.find({
    deleted: false,
    status: 'active',
    $or: [
      { $and: regexConditions },
      { product_category_id: { $in: categoryIds.length > 0 ? categoryIds : [null] } }
    ]
  });
  console.log('Products:', searchProduct.map(p => p.title));
  process.exit(0);
});
