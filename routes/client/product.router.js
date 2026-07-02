const express = require('express');
const router = express.Router();
const productController = require('../../controller/client/product.controller');
const cacheMiddleware = require('../../middleware/client/cache.middleware');

// Cache product pages for 1 minute (60 seconds)
router.get('/', cacheMiddleware.cacheRoute(60), productController.index);
router.get('/detail/:slug', cacheMiddleware.cacheRoute(60), productController.detail);
router.get('/c/:slug',productController.getProductsByCategory);

module.exports = router;
