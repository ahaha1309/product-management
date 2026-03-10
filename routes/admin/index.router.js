const dashboardRouter = require('./dashboard.router');
const systemConfig = require('../../config/system');
const productRouter = require('./product.router');
module.exports = (app) => {
  const path_admin = systemConfig.prefixAdmin;
  app.use(path_admin + '/dashboard', dashboardRouter);
  app.use(path_admin + '/product', productRouter);
};
