const productModel = require('../../models/product.model');
const categoryModel = require('../../models/product-category.model');
const productHelper = require('../../helper/product');

// Helper to convert Vietnamese text to unaccented slug format with spaces
function createUnaccentedText(str) {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
  str = str.replace(/ + /g, " ");
  return str.trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

module.exports.search = async (req, res) => {
  const keyword = req.query.keyword || '';
  if (!keyword.trim()) {
    return res.render('client/pages/products/index.pug', {
      title: `Kết quả tìm kiếm cho ""`,
      product: [],
      keyword: '',
    });
  }

  // 1. Convert to unaccented keyword
  let searchRaw = createUnaccentedText(keyword);

  // 2. Unaccented Synonym Dictionary
  const synonyms = {
    'my pham': ['son moi', 'kem duong', 'phan', 'mat na', 'serum', 'trang diem'],
    'dien thoai': ['iphone', 'samsung', 'oppo', 'xiaomi', 'smartphone', 's24', 'galaxy'],
    'may tinh': ['laptop', 'pc', 'macbook', 'dell', 'hp', 'asus'],
    'quan ao': ['ao', 'quan', 'vay', 'dam', 'thoi trang'],
    'giay the thao': ['giay bong da', 'sneaker', 'giay chay bo', 'giay tennis', 'giay cau long', 'giay the thao'],
    'giay': ['sneaker', 'giay the thao', 'giay da', 'boot', 'giay bong da'],
    'samsung': ['s24', 's23', 'galaxy', 'z fold', 'z flip', 'a15', 'a54', 'a05'],
    'apple': ['iphone', 'macbook', 'ipad', 'apple watch', 'airpods'],
    'iphone': ['iphone 15', 'iphone 14', 'iphone 13', 'iphone 12', 'iphone 11']
  };

  // 3. Extract synonyms and token injection
  let regexConditions = [];
  
  // Sort keys by length descending to match longest phrases first (e.g. 'giay the thao' before 'giay')
  const sortedKeys = Object.keys(synonyms).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (searchRaw.includes(key)) {
      // Create a regex for this synonym group with slug boundaries (^|-) and (-|$)
      const synonymList = [key, ...synonyms[key]].map(k => escapeRegExp(k.replace(/ /g, '-')));
      const synonymRegexPattern = synonymList.join('|');
      regexConditions.push({ slug: new RegExp(`(^|-)(${synonymRegexPattern})(-|$)`, 'i') });
      
      // Remove this matched key from the raw search string so we don't tokenize it later
      searchRaw = searchRaw.replace(key, ' ');
    }
  }

  // 4. Tokenize the remaining words
  const words = searchRaw.split(/\s+/).filter(w => w.length > 0);
  for (const word of words) {
    regexConditions.push({ slug: new RegExp(`(^|-)` + escapeRegExp(word) + `(-|$)`, 'i') });
  }

  // If no valid tokens generated, just return empty
  if (regexConditions.length === 0) {
    return res.render('client/pages/products/index.pug', {
      title: `Kết quả tìm kiếm cho "${keyword}"`,
      product: [],
      keyword: keyword,
    });
  }

  // 5. Build $and query for Categories
  const categoryQuery = {
    deleted: false,
    status: 'active',
    $and: regexConditions
  };
  
  const matchedCategories = await categoryModel.find(categoryQuery);
  const categoryIds = matchedCategories.map(cat => cat._id.toString());

  // 6. Build query for Products: (Matches ALL tokens in slug) OR (Matches Category)
  const searchProduct = await productModel.find({
    deleted: false,
    status: 'active',
    $or: [
      { $and: regexConditions },
      { product_category_id: { $in: categoryIds.length > 0 ? categoryIds : [null] } }
    ]
  });

  const newProduct = productHelper.productHelper(searchProduct);
  
  res.render('client/pages/products/index.pug', {
    title: `Kết quả tìm kiếm cho "${keyword}"`,
    product: newProduct,
    keyword: keyword,
  });
};