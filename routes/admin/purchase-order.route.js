const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/purchase-order.controller');

router.get('/', controller.index);

router.get('/create', controller.createGet);
router.post('/create', controller.createPost);

router.get('/detail/:id', controller.detail);

module.exports = router;
