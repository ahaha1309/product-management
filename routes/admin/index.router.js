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
module.exports = (app) => {
  const path_admin = systemConfig.prefixAdmin;
  app.use(path_admin + '/dashboard',authMiddleware.requireAuth, dashboardRouter);
  app.use(path_admin + '/product',authMiddleware.requireAuth, productRouter);
  app.use(path_admin + '/category-product',authMiddleware.requireAuth, categoryProductRouter);
  app.use(path_admin + '/category-article',authMiddleware.requireAuth, categoryArticleRouter);
  app.use(path_admin + '/roles', authMiddleware.requireAuth, roleRouter);
  app.use(path_admin + '/accounts', authMiddleware.requireAuth, accountRouter);
  app.use(path_admin + '/articles', authMiddleware.requireAuth, articleRouter);
  app.get(path_admin, (req, res) => {
    res.redirect(path_admin + '/auth/login');
  });
  app.use(path_admin + '/auth', authRouter);
  app.use(path_admin + '/my-account',authMiddleware.requireAuth, myAccountRouter);
};
