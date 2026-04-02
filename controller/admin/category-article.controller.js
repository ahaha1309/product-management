const articleModel = require('../../models/article-category.model');
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
  const categoryArticle = await articleModel.find(find).sort(sort).collation({ locale: 'vi' });
  const categoryArticleTree = createTreeHelper.createTree(categoryArticle, '_id', 'parent_id', 'children' );
  var objectRespon = {
    title: 'Danh mục bài viết',
    categoryArticle: categoryArticleTree,
    button: fillterStatus,
    keyword: search.keyword,
  };

  res.render('admin/pages/articles-category/index', objectRespon);
};