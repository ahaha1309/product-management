const express = require('express');
const router = express.Router();
const homeController = require('../../controller/client/home.controller');
const cacheMiddleware = require('../../middleware/client/cache.middleware');

// Cache home page for 2 minutes (120 seconds)
router.get('/', cacheMiddleware.cacheRoute(120), homeController.index);
module.exports = router;
