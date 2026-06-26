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
  const categoryArticleTree = createTreeHelper.createTree(categoryArticle);
  var objectRespon = {
    title: 'Danh mục bài viết',
    categoryArticle: categoryArticleTree,
    button: fillterStatus,
    keyword: search.keyword,
  };

  res.render('admin/pages/articles-category/index', objectRespon);
};

module.exports.detail = async (req, res) => {
  try {
    const category = await articleModel.findOne({ _id: req.params.id, deleted: false });
    res.render('admin/pages/articles-category/detail', {
      title: category ? category.title : 'Không tìm thấy',
      category: category
    });
  } catch (error) {
    res.redirect('back');
  }
};

module.exports.edit = async (req, res) => {
  try {
    const category = await articleModel.findOne({ _id: req.params.id, deleted: false });
    const categoryArticle = await articleModel.find({deleted:false});
    const categoryArticleTree = createTreeHelper.createTree(categoryArticle);
    
    res.render('admin/pages/articles-category/edit', {
      title: 'Chỉnh sửa danh mục bài viết',
      category: category,
      categories: categoryArticleTree
    });
  } catch (error) {
    res.redirect('back');
  }
};

module.exports.editPatch = async (req, res) => {
  try {
    req.body.position = req.body.position ? parseInt(req.body.position) : undefined;
    if (req.file) {
      req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    
    await articleModel.updateOne({ _id: req.params.id }, req.body);
    req.flash('success', 'Cập nhật thành công!');
    res.redirect('back');
  } catch (error) {
    req.flash('error', 'Cập nhật thất bại!');
    res.redirect('back');
  }
};

module.exports.create = async (req, res) => {
  const categoryArticle = await articleModel.find({deleted:false});
  const categoryArticleTree = createTreeHelper.createTree(categoryArticle);
  
  res.render('admin/pages/articles-category/create', {
    title: 'Thêm mới danh mục bài viết',
    categories: categoryArticleTree
  });
};

module.exports.createPost = async (req, res) => {
  try {
    req.body.position = req.body.position ? parseInt(req.body.position) : undefined;
    if (req.file) {
      req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    
    await articleModel.create(req.body);
    req.flash('success', 'Thêm mới thành công!');
    res.redirect(`${require('../../config/system').prefixAdmin}/category-article`);
  } catch (error) {
    req.flash('error', 'Thêm mới thất bại!');
    res.redirect('back');
  }
};