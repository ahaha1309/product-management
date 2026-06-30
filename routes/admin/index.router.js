const dashboardRouter = require('./dashboard.router');
const systemConfig = require('../../config/system');
const productRouter = require('./product.router');
const categoryProductRouter=require('./category-product.router')
const roleRouter=require('./role.router');
const accountRouter=require('./account.router');
const authRouter=require('./auth.router');
const authMiddleware=require('../../middleware/admin/auth.middleware');
const articleRouter=require('./article.router');
const categoryArticleRouter=require('./category-article.router');
const myAccountRouter=require('./my-account.router');
const orderRouter=require('./order.router')
const analyticsRouter = require('./analytics.router');
const loyaltyRouter = require('./loyalty.router');
const articleCommentRouter = require("./article-comment.router");

module.exports = (app) => {
  const path_admin = systemConfig.prefixAdmin;
  app.use(path_admin + '/dashboard',authMiddleware.requireAuth, dashboardRouter);
  app.use(path_admin + '/product',authMiddleware.requireAuth, productRouter);
  app.use(path_admin + '/category-product',authMiddleware.requireAuth, categoryProductRouter);
  app.use(path_admin + '/category-article',authMiddleware.requireAuth, categoryArticleRouter);
  app.use(path_admin + '/article-comments', authMiddleware.requireAuth, articleCommentRouter);
  app.use(path_admin + '/roles', authMiddleware.requireAuth, roleRouter);
  app.use(path_admin + '/accounts', authMiddleware.requireAuth, accountRouter);
  app.use(path_admin + '/articles', authMiddleware.requireAuth, articleRouter);
  app.get(path_admin, (req, res) => {
    res.redirect(path_admin + '/auth/login');
  });
  app.use(path_admin + '/auth', authRouter);
  app.use(path_admin + '/my-account',authMiddleware.requireAuth, myAccountRouter);
  app.use(path_admin + '/orders', authMiddleware.requireAuth, orderRouter);
  app.use(path_admin + '/analytics', authMiddleware.requireAuth, analyticsRouter);
  app.use(path_admin + '/reviews', authMiddleware.requireAuth, require('./reviews.router'));
  // ✅ NEW: Loyalty management
  app.use(path_admin + '/users', authMiddleware.requireAuth, require('./user.router'));
  app.use(path_admin + '/loyalty', authMiddleware.requireAuth, loyaltyRouter);
  app.use(path_admin + '/chats', authMiddleware.requireAuth, require('./chat.route'));
  app.use(path_admin + '/vouchers', authMiddleware.requireAuth, require('./voucher.router'));
  app.use(path_admin + '/notifications', authMiddleware.requireAuth, require('./notification.route'));
  app.use(path_admin + '/settings', authMiddleware.requireAuth, require('./setting.router'));
};
