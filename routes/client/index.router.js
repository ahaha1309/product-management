const productRouter = require('./product.router');
const homeRouter = require('./home.router');
const categoryMiddleware = require('../../middleware/client/category.middleware');
const authMiddleware=require('../../middleware/client/auth.middleware')
const searchRouter=require('./search.router')
const cartRouter=require('./cart.router')
const authRouter=require('./auth.router')

module.exports = (app) => {
  app.use(categoryMiddleware.category);
  app.use(authMiddleware.infoUser);
  
  app.use('/',  homeRouter);
  app.use('/product', productRouter);
  app.use('/search',searchRouter)
  app.use('/cart',authMiddleware.requireAuth,cartRouter)
  app.use('/auth',authRouter)
};
