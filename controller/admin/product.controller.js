const Product = require('../../models/product.model');
const ProductVariant = require('../../models/product-variant.model');
const fillterButtonHelper = require('../../helper/fillterButton');
const searchHelper = require('../../helper/search');
const paginationHelper = require('../../helper/pagination');
const systemConfig = require('../../config/system');
const createTreeHelper = require('../../helper/createTree');
const categoryModel = require('../../models/product-category.model');
const account = require('../../models/account.model');
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
    sort['position'] = 'desc';
  }
  //end
  const product = await Product.find(find)
    .sort(sort)
    .collation({ locale: 'vi' })
    .limit(pagination.limit)
    .skip(pagination.skip);
  for (const item of product) {
    const userCreate = await account.findById(item.createdBy.accountId).select('fullname');
    if (item.updatedBy && item.updatedBy.length > 0) {
      const lastUpdate = item.updatedBy[item.updatedBy.length - 1];
      const userUpdate = await account.findById(lastUpdate.accountId).select('fullname');
      item.updatedByName = userUpdate?.fullname || '';
    } else {
      item.updatedByName = '';
    }
    item.fullname = userCreate?.fullname || '';
  }
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
  await Product.updateOne(
    { _id: id },
    {
      status: status,
      $push: { updatedBy: { accountId: res.locals.account.id, updatedAt: new Date() } },
    }
  );
  req.flash('success', `Cập nhật trạng thái thành công!`);
  res.redirect('back');
};
module.exports.changeActivity = async (req, res) => {
  const activity = req.params.activity;
  const id = req.params.id;
  if (activity == 'delete') {
    await Product.updateOne(
      { _id: id },
      { deleted: true, deletedBy: { accountId: res.locals.account.id, deletedAt: new Date() } }
    );
  }
  res.redirect('back');
};
module.exports.changeMulti = async (req, res) => {
  const status = req.body.type;
  const ids = req.body.ids.split(',').filter((id) => id);
  switch (status) {
    case 'active':
      await Product.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            status: 'active',
            $push: { updatedBy: { accountId: res.locals.account.id, updatedAt: new Date() } },
          },
        }
      );
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'inactive':
      await Product.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            status: 'inactive',
            $push: { updatedBy: { accountId: res.locals.account.id, updatedAt: new Date() } },
          },
        }
      );
      req.flash('success', `Cập nhật trạng thái thành công!`);
      break;
    case 'delete':
      await Product.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            deleted: true,
            deletedBy: { accountId: res.locals.account.id, deletedAt: new Date() },
          },
        }
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
        await Product.updateOne(
          { _id: item.id },
          {
            $set: {
              position: item.position,
              $push: { updatedBy: { accountId: res.locals.account.id, updatedAt: new Date() } },
            },
          }
        );
      }
      req.flash('success', `Cập nhật vị trí thành công!`);
      break;
    default:
      return res.redirect('back');
  }
  res.redirect('back');
};

module.exports.create = async (req, res) => {
  const categoryParent = await categoryModel.find({ deleted: false });
  const categories = createTreeHelper.createTree(categoryParent);
  res.render('admin/pages/products/create', {
    title: 'Thêm mới sản phẩm',
    categories: categories,
  });
};
module.exports.edit = async (req, res) => {
  const categoryParent = await categoryModel.find({ deleted: false });
  const categories = createTreeHelper.createTree(categoryParent);
  const id = req.params.id;
  try {
    const product = await Product.findOne({ _id: id });
    const variants = await ProductVariant.find({ productId: id }).sort({ createdAt: 1 });
    res.render('admin/pages/products/edit', {
      title: 'Chỉnh sửa sản phẩm',
      product: product,
      id: id,
      categories: categories,
      variants: variants,
    });
  } catch (error) {
    req.flash('error', 'Không tồn tại sản phẩm này');
    res.redirect(`${systemConfig.prefixAdmin}/product`);
  }
};

// --- Variant API handlers ---
module.exports.variantCreate = async (req, res) => {
  const productId = req.params.id;
  try {
    const { sku, color, size, storage, price, discount, quantity, status, variantImage } = req.body;
    const priceNum = parseFloat(price) || 0;
    const discountNum = parseFloat(discount) || 0;
    const finalPrice = +(priceNum * (1 - discountNum / 100)).toFixed(0);
    const images = variantImage ? [{ url: variantImage, alt: sku, isPrimary: true }] : [];
    const variant = await ProductVariant.create({
      productId,
      sku: sku.trim().toUpperCase(),
      attributes: { color, size, storage },
      pricing: { price: priceNum, discount: discountNum, finalPrice },
      stock: { quantity: parseInt(quantity) || 0, available: parseInt(quantity) || 0 },
      status: status || 'active',
      images,
    });
    res.json({ success: true, variant });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

module.exports.variantUpdate = async (req, res) => {
  const variantId = req.params.variantId;
  try {
    const { sku, color, size, storage, price, discount, quantity, status, variantImage } = req.body;
    const priceNum = parseFloat(price) || 0;
    const discountNum = parseFloat(discount) || 0;
    const finalPrice = +(priceNum * (1 - discountNum / 100)).toFixed(0);
    const updateData = {
      sku: sku.trim().toUpperCase(),
      attributes: { color, size, storage },
      pricing: { price: priceNum, discount: discountNum, finalPrice },
      stock: { quantity: parseInt(quantity) || 0, available: parseInt(quantity) || 0 },
      status: status || 'active',
      updatedAt: new Date(),
    };
    // Chỉ cập nhật ảnh nếu có ảnh mới được upload
    if (variantImage) {
      updateData.images = [{ url: variantImage, alt: sku, isPrimary: true }];
    }
    const variant = await ProductVariant.findByIdAndUpdate(variantId, updateData, { new: true });
    res.json({ success: true, variant });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

module.exports.variantDelete = async (req, res) => {
  const variantId = req.params.variantId;
  try {
    await ProductVariant.findByIdAndDelete(variantId);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
module.exports.createPost = async (req, res) => {
  try {
    const autoPosition = await Product.countDocuments({ deleted: false });
    const title = req.body.title;
    const description = req.body.description;
    const price = parseInt(req.body.price);
    const product_category_id = req.body.product_category_id;
    const discount = parseInt(req.body.discount);
    const quantity = parseInt(req.body.quantity);
    const position = parseInt(req.body.position) || autoPosition + 1;
    const featured = req.body.featured ;
    const status = req.body.status;
    const data = {
      title: title,
      description: description,
      price: price,
      discountPercentage: discount,
      stock: quantity,
      createdBy: {
        accountId: res.locals.account.id,
        createdAt: new Date(),
      },
      thumbnail: req.body.thumbnail || '',
      status: status,
      position: position,
      product_category_id: product_category_id,
      requireVariants: req.body.requireVariants === 'true',
      featured: featured,
    };
    await Product.create(data);
    res.redirect(`${systemConfig.prefixAdmin}/product`);
  } catch (error) {
    console.log('Create Product Error:', error);
    res.redirect(`${systemConfig.prefixAdmin}/product`);
  }
};
module.exports.editPost = async (req, res) => {
  const id = req.params.id;
  const product = await Product.findOne({ _id: id });
  let thumbnail = product.thumbnail;
  const title = req.body.title;
  const product_category_id = req.body.product_category_id;
  const description = req.body.description;
  const price = parseInt(req.body.price);
  const discount = parseInt(req.body.discount);
  const quantity = parseInt(req.body.quantity);
  if (req.file) {
    thumbnail = req.body[req.file.fieldname];
  }
  const position = parseInt(req.body.position);
  const featured = req.body.featured ;
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
    product_category_id: product_category_id,
    requireVariants: req.body.requireVariants === 'true',
    featured: featured,

  };
  try {
    await Product.updateOne(
      { _id: id },
      {
        $set: data,
        $push: { updatedBy: { accountId: res.locals.account.id, updatedAt: new Date() } },
      }
    );
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
