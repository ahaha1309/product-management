const categoryModel = require('../../models/product-category.model');
const createTreeHelper = require('../../helper/createTree');
module.exports.category = async (req, res, next) => {
  let find = {
    deleted: false,
  };
  const categoryProduct = await categoryModel.find(find).collation({ locale: 'vi' });
  const category = createTreeHelper.createTree(categoryProduct);
  res.locals.category = category;
  next();
};
