const dashboardRouter = require('./dashboard.router');
const systemConfig = require('../../config/system');
const productRouter = require('./product.router');
const categoryRouter=require('./category-product.router')
const roleRouter=require('./role.router');
const accountRouter=require('./account.router');
const authRouter=require('./auth.router');
const authMiddleware=require('../../middleware/admin/auth.middleware');
module.exports = (app) => {
  const path_admin = systemConfig.prefixAdmin;
  app.use(path_admin + '/dashboard',authMiddleware.requireAuth, dashboardRouter);
  app.use(path_admin + '/product',authMiddleware.requireAuth, productRouter);
  app.use(path_admin + '/category-product',authMiddleware.requireAuth, categoryRouter);
  app.use(path_admin + '/roles', authMiddleware.requireAuth, roleRouter);
  app.use(path_admin + '/accounts', authMiddleware.requireAuth, accountRouter);
  app.get(path_admin, (req, res) => {
    res.redirect(path_admin + '/auth/login');
  });
  app.use(path_admin + '/auth', authRouter);
};
