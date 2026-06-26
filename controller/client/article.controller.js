const Article = require('../../models/article.model');
const ArticleCategory = require('../../models/article-category.model');

// [GET] /articles - Danh sách bài viết
module.exports.index = async (req, res) => {
  try {
    const categoryId = req.query.category;
    const find = { deleted: false, status: 'active' };
    if (categoryId) find.article_category_id = categoryId;

    const articles = await Article.find(find)
      .sort({ createdAt: -1 })
      .limit(12);

    const categories = await ArticleCategory.find({ deleted: false, status: 'active' });

    res.render('client/pages/articles/index', {
      title: 'Tin tức & Blog - VanHa Tech',
      articles,
      categories,
      currentCategory: categoryId || null
    });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
};

// [GET] /articles/:slug - Chi tiết bài viết
module.exports.detail = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug, deleted: false });

    if (!article) {
      return res.redirect('/articles');
    }

    const recentArticles = await Article.find({
      deleted: false,
      status: 'active',
      _id: { $ne: article._id }
    }).sort({ createdAt: -1 }).limit(4);

    res.render('client/pages/articles/detail', {
      title: `${article.title} - VanHa Tech Blog`,
      article,
      recentArticles
    });
  } catch (error) {
    console.log(error);
    res.redirect('/articles');
  }
};
