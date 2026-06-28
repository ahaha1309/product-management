const ArticleComment = require('../../models/article-comment.model');
const Article = require('../../models/article.model');

// [GET] /admin/article-comments
module.exports.index = async (req, res) => {
  try {
    const comments = await ArticleComment.find({ deleted: false }).sort({ createdAt: -1 });

    // Populate article titles for display
    for (const comment of comments) {
      const article = await Article.findOne({ _id: comment.article_id });
      if (article) {
        comment.articleTitle = article.title;
        comment.articleSlug = article.slug;
      }
    }

    res.render('admin/pages/article-comments/index', {
      pageTitle: 'Quản lý bình luận bài viết',
      comments: comments
    });
  } catch (error) {
    console.log(error);
    res.redirect('back');
  }
};

// [PATCH] /admin/article-comments/delete/:id
module.exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await ArticleComment.updateOne(
      { _id: id },
      { 
        deleted: true,
        deletedAt: new Date()
      }
    );

    req.flash('success', 'Đã xóa bình luận thành công!');
    res.redirect('back');
  } catch (error) {
    console.log(error);
    req.flash('error', 'Đã có lỗi xảy ra!');
    res.redirect('back');
  }
};
