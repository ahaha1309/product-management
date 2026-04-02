const express = require('express');
const router = express.Router();
const productController = require('../../controller/client/product.controller');

router.get('/', productController.index);
router.get('/detail/:slug',productController.detail);
router.get('/c/:slug',productController.getProductsByCategory);

module.exports = router;
