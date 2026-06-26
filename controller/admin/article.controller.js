const articleModel = require('../../models/article.model');
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
  const articles = await articleModel
    .find(find)
    .sort({ createdAt: -1 });
  const data={
    title: 'Danh sách bài viết',
    message: 'Danh sách bài viết',
    articles: articles,
    button: fillterStatus,
    keyword: search.keyword,
  }
  res.render('admin/pages/articles/index', data);
};

module.exports.detail = async (req, res) => {
  try {
    const article = await articleModel.findOne({ _id: req.params.id, deleted: false });
    res.render('admin/pages/articles/detail', {
      title: article ? article.title : 'Không tìm thấy',
      article: article
    });
  } catch (error) {
    res.redirect('back');
  }
};
module.exports.edit = async (req, res) => {
  try {
    const article = await articleModel.findOne({ _id: req.params.id, deleted: false });
    const articleCategoryModel = require('../../models/article-category.model');
    const createTreeHelper = require('../../helper/createTree');
    const categoryArticle = await articleCategoryModel.find({deleted:false});
    const categoryArticleTree = createTreeHelper.createTree(categoryArticle);
    
    res.render('admin/pages/articles/edit', {
      title: 'Chỉnh sửa bài viết',
      article: article,
      categoryArticle: categoryArticleTree
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
  const articleCategoryModel = require('../../models/article-category.model');
  const createTreeHelper = require('../../helper/createTree');
  const categoryArticle = await articleCategoryModel.find({deleted:false});
  const categoryArticleTree = createTreeHelper.createTree(categoryArticle);
  
  res.render('admin/pages/articles/create', {
    title: 'Thêm mới bài viết',
    categoryArticle: categoryArticleTree
  });
};

module.exports.createPost = async (req, res) => {
  try {
    req.body.position = req.body.position ? parseInt(req.body.position) : undefined;
    if (req.file) {
      req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    req.body.createdBy = {
      accountId: res.locals.account.id,
      createdAt: new Date()
    };
    
    await articleModel.create(req.body);
    req.flash('success', 'Thêm mới thành công!');
    res.redirect(`${require('../../config/system').prefixAdmin}/articles`);
  } catch (error) {
    req.flash('error', 'Thêm mới thất bại!');
    res.redirect('back');
  }
};
