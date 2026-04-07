const productRouter = require('./product.router');
const homeRouter = require('./home.router');
const categoryMiddleware = require('../../middleware/client/category.middleware');
const authMiddleware=require('../../middleware/client/auth.middleware')
const searchRouter=require('./search.router')
const cartRouter=require('./cart.router')
const authRouter=require('./auth.router')
const userRouter=require('./user.router')
const orderRouter=require('./order.router')
const chatBotRouter=require('./chatBot.router')

module.exports = (app) => {
  app.use(categoryMiddleware.category);
  app.use(authMiddleware.infoUser);
  
  app.use('/',  homeRouter);
  app.use('/product', productRouter);
  app.use('/search',searchRouter)
  app.use('/cart',authMiddleware.requireAuth,cartRouter)
  app.use('/auth',authRouter);
  app.use('/my-account',userRouter)
  app.use('/checkout',orderRouter)
  app.use('/chatbot',chatBotRouter)
  
};
