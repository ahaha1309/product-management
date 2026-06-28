const mongoose = require('mongoose');

const articleCommentSchema = new mongoose.Schema({
  article_id: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Khách hàng'
  },
  userAvatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=Khach+Hang&background=random'
  },
  text: {
    type: String,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

const ArticleComment = mongoose.model('ArticleComment', articleCommentSchema, 'article-comments');
module.exports = ArticleComment;
