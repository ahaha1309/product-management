const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/article-comment.controller');

router.get('/', controller.index);
router.patch('/delete/:id', controller.deleteItem);

module.exports = router;
