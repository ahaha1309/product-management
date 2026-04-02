const express = require('express');
const router = express.Router();
const categoryArticleController = require('../../controller/admin/category-article.controller');
router.get('/', categoryArticleController.index);
module.exports = router;