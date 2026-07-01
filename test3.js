const mongoose = require('mongoose');
const categoryModel = require('./models/product-category.model');
const productModel = require('./models/product.model');
require('dotenv').config();

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

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const tests = ['giay', 'giày', 'wika giày thể thao', 'mỹ phẩm', 'apple', 'giay wika', 'iphone wika'];
  
  for (const keyword of tests) {
    let searchRaw = createUnaccentedText(keyword);
    const synonyms = {
      'my pham': ['son', 'kem', 'duong', 'phan', 'mat na', 'serum', 'trang diem'],
      'dien thoai': ['iphone', 'samsung', 'oppo', 'xiaomi', 'smartphone', 's24', 'galaxy'],
      'giay the thao': ['giay bong da', 'sneaker', 'giay chay bo', 'giay tennis', 'giay cau long', 'giay the thao'],
      'giay': ['sneaker', 'giay the thao', 'giay da', 'boot', 'giay bong da'],
      'samsung': ['s24', 's23', 'galaxy', 'z fold', 'z flip', 'a15', 'a54', 'a05'],
      'apple': ['iphone', 'macbook', 'ipad', 'apple watch', 'airpods'],
    };

    let regexConditions = [];
    const sortedKeys = Object.keys(synonyms).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (searchRaw.includes(key)) {
        const synonymList = [key, ...synonyms[key]].map(k => escapeRegExp(k.replace(/ /g, '-')));
        const synonymRegexPattern = synonymList.join('|');
        regexConditions.push({ slug: new RegExp(`(${synonymRegexPattern})`, 'i') });
        searchRaw = searchRaw.replace(key, ' ');
      }
    }
    const words = searchRaw.split(/\s+/).filter(w => w.length > 0);
    for (const word of words) {
      regexConditions.push({ slug: new RegExp(escapeRegExp(word), 'i') });
    }

    const matchedCategories = await categoryModel.find({ deleted: false, status: 'active', $and: regexConditions });
    const categoryIds = matchedCategories.map(cat => cat._id.toString());

    const searchProduct = await productModel.find({
      deleted: false,
      status: 'active',
      $or: [
        { $and: regexConditions },
        { product_category_id: { $in: categoryIds.length > 0 ? categoryIds : [null] } }
      ]
    });
    console.log(`\n=== Test "${keyword}" ===`);
    console.log('Regexes:', regexConditions);
    console.log('Products found:', searchProduct.map(p => p.title));
  }
  process.exit(0);
});
