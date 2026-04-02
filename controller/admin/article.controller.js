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
    .populate('category')
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
