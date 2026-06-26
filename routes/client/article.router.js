const express = require('express');
const router = express.Router();
const articleController = require('../../controller/client/article.controller');

// [GET] /articles
router.get('/', articleController.index);

// [GET] /articles/:slug
router.get('/:slug', articleController.detail);

module.exports = router;
