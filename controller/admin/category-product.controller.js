const categoryModel = require('../../models/product-category.model');
const systemConfig = require('../../config/system');
const fillterButtonHelper = require('../../helper/fillterButton');
const searchHelper = require('../../helper/search');
const createTreeHelper = require('../../helper/createTree');
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
    sort['position'] = 'desc';
  }
  const categoryProduct = await categoryModel.find(find).sort(sort).collation({ locale: 'vi' });
  const categoryProductTree = createTreeHelper.createTree(categoryProduct);
  var objectRespon = {
    title: 'Danh mục sản phẩm',
    categoryProduct: categoryProductTree,
    button: fillterStatus,
    keyword: search.keyword,
  };

  res.render('admin/pages/products-category/index', objectRespon);
};
module.exports.changeStatus = async (req, res) => {
  const status = req.params.status;
  const id = req.params.id;

  await categoryModel.updateOne({ _id: id }, { status: status });
  req.flash('success', `Cập nhật trạng thái thành công!`);
  res.redirect('back');
};
module.exports.changeActivity = async (req, res) => {
  const activity = req.params.activity;
  const id = req.params.id;
  if (activity == 'delete') {
    await categoryModel.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
  }
  res.redirect('back');
};
module.exports.changeMulti = async (req, res) => {
  const status = req.body.type;
  const ids = req.body.ids.split(',').filter((id) => id);
  switch (status) {
    case 'active':
      await categoryModel.updateMany({ _id: { $in: ids } }, { $set: { status: 'active' } });
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'inactive':
      await categoryModel.updateMany({ _id: { $in: ids } }, { $set: { status: 'inactive' } });
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'delete':
      await categoryModel.updateMany(
        { _id: { $in: ids } },
        { $set: { deleted: true, deletedAt: new Date() } }
      );
      req.flash('success', `Xóa thành công!`);
      break;
    case 'position':
      let result = ids.map((item) => {
        const [id, position] = item.split(':');
        return {
          id: id,
          position: parseInt(position),
        };
      });
      for (const item of result) {
        await categoryModel.updateOne({ _id: item.id }, { $set: { position: item.position } });
      }
      req.flash('success', `Cập nhật vị trí thành công!`);
      break;
    default:
      return res.redirect('back');
  }
  res.redirect('back');
};
module.exports.create = async (req, res) => {
  const find = {
    deleted: false,
  };
  const category = await categoryModel.find(find);
  const categories = createTreeHelper.createTree(category);
  var objectRespon = {
    title: 'Tạo danh mục sản phẩm',
    categories: categories,
  };

  res.render('admin/pages/products-category/create', objectRespon);
};

module.exports.edit = async (req, res) => {
  const id = req.params.id;
  try {
    const category = await categoryModel.findOne({ _id: id });
    const categoryParent = await categoryModel.find({ deleted: false });
    const categories = createTreeHelper.createTree(categoryParent);
    res.render('admin/pages/products-category/edit', {
      title: 'Chỉnh sửa danh mục sản phẩm',
      category: category,
      id: id,
      categories: categories,
    });
  } catch (error) {
    req.flash('error', 'Không tồn tại danh mục này');
    res.redirect(`${systemConfig.prefixAdmin}/category-product`);
  }
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
    console.log('Create Category Error:', error);
    res.redirect(`${systemConfig.prefixAdmin}/category-product`);
  }
};
module.exports.editPost = async (req, res) => {
  try {
    const id = req.params.id;
    const title = req.body.title;
    const parent_id = req.body.parent_id || '';
    const description = req.body.description;
    console.log(description);
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
    await categoryModel.updateOne({ _id: id }, { $set: data });
    res.redirect(`${systemConfig.prefixAdmin}/category-product`);
  } catch (error) {
    console.log('Edit Category Error:', error);
    res.redirect(`${systemConfig.prefixAdmin}/category-product`);
  }
};
module.exports.detail = async (req, res) => {
  const id = req.params.id;
  try {
    const categoryParent = await categoryModel.find({ deleted: false });
    const categories = createTreeHelper.createTree(categoryParent);
    const category = await categoryModel.findOne({ _id: id });
    res.render('admin/pages/products-category/detail', {
      title: category.title,
      category: category,
      id: id,
      categories: categories,
    });
  } catch (error) {
    req.flash('error', 'Không tồn tại danh mục này');
    res.redirect(`${systemConfig.prefixAdmin}/category-product`);
  }
};
module.exports.delete = async (req, res) => {
  const activity = req.params.activity;
  const id = req.params.id;
  if (activity == 'delete') {
    await categoryModel.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
  }
  res.redirect('back');
};