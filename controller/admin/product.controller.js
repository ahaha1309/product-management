const Product = require('../../models/product.model');
const fillterButtonHelper = require('../../helper/fillterButton');
const searchHelper = require('../../helper/search');
const paginationHelper = require('../../helper/pagination');
const systemConfig = require('../../config/system');
module.exports.product = async (req, res) => {
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

  const countProduct = await Product.countDocuments(find);
  const pagination = paginationHelper(req.query, countProduct);
  //sort
  let sort = {};
  if (req.query.sortKey && req.query.value) {
    sort[req.query.sortKey] = req.query.value;
  } else {
    sort['position']='desc'
  }
  //end
  const product = await Product.find(find)
    .sort(sort)
    .collation({ locale: 'vi' })
    .limit(pagination.limit)
    .skip(pagination.skip);
  var objectRespon = {
    title: 'Danh sách sản phẩm',
    message: 'Danh sách sản phẩm',
    product: product,
    button: fillterStatus,
    keyword: search.keyword,
    pagination: pagination,
  };
  res.render('admin/pages/products/index', objectRespon);
};
module.exports.changeStatus = async (req, res) => {
  const status = req.params.status;
  const id = req.params.id;

  await Product.updateOne({ _id: id }, { status: status });
  req.flash('success', `Cập nhật trạng thái thành công!`);
  res.redirect('back');
};
module.exports.changeActivity = async (req, res) => {
  const activity = req.params.activity;
  const id = req.params.id;
  if (activity == 'delete') {
    await Product.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
  }
  res.redirect('back');
};
module.exports.changeMulti = async (req, res) => {
  const status = req.body.type;
  const ids = req.body.ids.split(',').filter((id) => id);
  switch (status) {
    case 'active':
      await Product.updateMany({ _id: { $in: ids } }, { $set: { status: 'active' } });
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'inactive':
      await Product.updateMany({ _id: { $in: ids } }, { $set: { status: 'inactive' } });
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'delete':
      await Product.updateMany(
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
        await Product.updateOne({ _id: item.id }, { $set: { position: item.position } });
      }
      req.flash('success', `Cập nhật vị trí thành công!`);
      break;
    default:
      return res.redirect('back');
  }
  res.redirect('back');
};

module.exports.create = async (req, res) => {
  res.render('admin/pages/products/create', {
    title: 'Thêm mới sản phẩm',
  });
};
module.exports.edit = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.findOne({ _id: id });
    res.render('admin/pages/products/edit', {
      title: 'Chỉnh sửa sản phẩm',
      product: product,
      id: id,
    });
  } catch (error) {
    req.flash('error', 'Không tồn tại sản phẩm này');
    res.redirect(`${systemConfig.prefixAdmin}/product`);
  }
};
module.exports.createPost = async (req, res) => {
  const autoPosition = await Product.countDocuments({ deleted: false });
  const title = req.body.title;
  const description = req.body.description;
  const price = parseInt(req.body.price);
  const discount = parseInt(req.body.discount);
  const quantity = parseInt(req.body.quantity);
  const position = parseInt(req.body.position) || autoPosition + 1;
  const status = req.body.status;
  const data = {
    title: title,
    description: description,
    price: price,
    discountPercentage: discount,
    stock: quantity,
    thumbnail: req.body[req.file.fieldname],
    status: status,
    position: position,
  };
  await Product.create(data);
  res.redirect(`${systemConfig.prefixAdmin}/product`);
};
module.exports.editPost = async (req, res) => {
  const id = req.params.id;
  const product = await Product.findOne({ _id: id });
  const thumbnail = product.thumbnail;
  const title = req.body.title;
  const description = req.body.description;
  const price = parseInt(req.body.price);
  const discount = parseInt(req.body.discount);
  const quantity = parseInt(req.body.quantity);
  if (req.file) {
    thumbnail = `/uploads/${req.file.filename}`;
  }
  const position = parseInt(req.body.position);
  const status = req.body.status;
  const data = {
    title: title,
    description: description,
    price: price,
    discountPercentage: discount,
    stock: quantity,
    thumbnail: thumbnail,
    status: status,
    position: position,
  };
  try {
    await Product.updateOne({ _id: id }, { $set: data });
    req.flash('success', 'Cập nhật thành công');
  } catch (error) {
    req.flash('error', 'Cập nhật thất bại');
  }
  res.redirect(`${systemConfig.prefixAdmin}/product`);
};

module.exports.detail = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.findOne({ _id: id });
    res.render('admin/pages/products/detail', {
      title: product.title,
      product: product,
      id: id,
    });
  } catch (error) {
    req.flash('error', 'Không tồn tại sản phẩm này');
    res.redirect(`${systemConfig.prefixAdmin}/product`);
  }
};
