const productRouter = require('./product.router');
const homeRouter = require('./home.router');
const categoryMiddleware = require('../../middleware/client/category.middleware');
const authMiddleware=require('../../middleware/client/auth.middleware');
const settingMiddleware = require('../../middleware/client/setting.middleware');
const searchRouter=require('./search.router')
const cartRouter=require('./cart.router')
const authRouter=require('./auth.router')
const userRouter=require('./user.router')
const orderRouter=require('./order.router')
const chatBotRouter=require('./chatBot.router')
const reviewRouter = require('./review.router');
const wishlistRouter = require('./wishlist.router');
const loyaltyRouter = require('./loyalty.router');
const recommendationRouter = require('./recommendation.router');
const contactRouter = require('./contact.router');
const policyRouter = require('./policy.router');
const articleRouter = require('./article.router');
const aboutRouter = require('./about.router');

module.exports = (app) => {
  app.use('/', categoryMiddleware.category);
  app.use('/', authMiddleware.infoUser);
  app.use('/', settingMiddleware.settingGeneral);
  
  app.use('/',  homeRouter);
  app.use('/product', productRouter);
  app.use('/search',searchRouter)
  app.use('/cart',authMiddleware.requireAuth,cartRouter)
  app.use('/auth',authRouter);
  app.use('/my-account',userRouter)
  app.use('/order',orderRouter)
  app.use('/chatbot',chatBotRouter)
  
  // ✅ EXISTING ROUTES
  app.use('/review', reviewRouter);
  app.use('/wishlist', authMiddleware.requireAuth, wishlistRouter);
  app.use('/loyalty', loyaltyRouter);
  app.use('/recommendation', recommendationRouter);
  app.use('/contact', contactRouter);
  app.use('/policy', policyRouter);

  // ✅ NEW ROUTES - NVH Mall
  app.use('/articles', articleRouter);
  app.use('/about', aboutRouter);
  app.use('/questions', require('./question.route'));
  
  // ✅ SEO - Sitemap
  app.get('/sitemap.xml', require('../../controller/client/sitemap.controller').index);

  // ✅ Intercept Socket.io requests (Vercel serverless doesn't support websockets natively)
  app.use('/socket.io', (req, res) => {
    res.status(400).json({ error: 'Socket.io not supported on Vercel Serverless' });
  });

  // 404 handler
  app.use((req, res) => {
    console.log("404 HIT:", req.method, req.originalUrl);
    res.status(404).render('client/pages/404', {
      title: '404 - Trang không tìm thấy',
    });
  });
};

