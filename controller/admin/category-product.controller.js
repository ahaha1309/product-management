const categoryModel = require('../../models/product-category.model');
const systemConfig = require('../../config/system');
const fillterButtonHelper = require('../../helper/fillterButton');
const searchHelper = require('../../helper/search');

module.exports.index = async (req, res) => {

    const fillterStatus = fillterButtonHelper(req.query);
    let find = {
      deleted: false,
    };
    if (req.query.status) {
      find.status = req.query.status;
    }
  
    const search = searchHelper(req.query);
    if (search.regex) {
      find.title = search.regex;
    }
     //sort
  let sort = {};
  if (req.query.sortKey && req.query.value) {
    sort[req.query.sortKey] = req.query.value;
  } else {
    sort['position']='desc'
  }
  const categoryProduct = await categoryModel.find(find).sort(sort).collation({ locale: 'vi' });
  var objectRespon = {
    title: 'Danh sách sản phẩm',
    categoryProduct: categoryProduct,
    button: fillterStatus,
    keyword: search.keyword
  };

  res.render('admin/pages/products-category/index', objectRespon);
};

module.exports.create = async (req, res) => {
  var objectRespon = {
    title: 'Tạo danh mục sản phẩm'
  };

  res.render('admin/pages/products-category/create', objectRespon);
};

module.exports.createPost = async (req, res) => {
  try {
  const autoPosition = await categoryModel.countDocuments({ deleted: false });
  const title = req.body.title;
  const parent_id = req.body.parent_id || '';
  const description = req.body.description;
  const position = parseInt(req.body.position);
  const status = req.body.status;
  const data = {
    title: title,
    parent_id: parent_id,
    description: description,
    thumbnail: req.file ? req.body[req.file.fieldname] : '',
    status: status,
    position: position || autoPosition + 1,
  };
  await categoryModel.create(data);
  res.redirect(`${systemConfig.prefixAdmin}/category-product`);
  } catch (error) {
    console.log("Create Category Error:", error);
    res.redirect(`${systemConfig.prefixAdmin}/category-product`);
  }
};