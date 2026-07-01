const Article = require('../../models/article.model');
const ArticleCategory = require('../../models/article-category.model');
const ArticleComment = require('../../models/article-comment.model');

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
      title: 'Tin tức & Blog - NVH Mall',
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

    // Lấy danh sách bình luận (mới nhất lên đầu)
    const comments = await ArticleComment.find({ article_id: article._id, deleted: false })
      .sort({ createdAt: -1 });

    res.render('client/pages/articles/detail', {
      title: `${article.title} - NVH Mall Blog`,
      article,
      recentArticles,
      comments
    });
  } catch (error) {
    console.log(error);
    res.redirect('/articles');
  }
};

// [POST] /articles/:slug/comment
module.exports.postComment = async (req, res) => {
  console.log("HIT POST COMMENT:", req.params.slug, req.body);
  try {
    if (!res.locals.user) {
      return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để bình luận' });
    }

    const { slug } = req.params;
    const article = await Article.findOne({ slug, deleted: false });
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const newComment = new ArticleComment({
      article_id: article._id,
      text: req.body.text,
      userName: res.locals.user.fullName,
      userAvatar: res.locals.user.avatar || 'https://ui-avatars.com/api/?name=User&background=random'
    });
    
    await newComment.save();
    
    return res.json({ 
      success: true, 
      message: 'Comment added', 
      comment: newComment 
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};
