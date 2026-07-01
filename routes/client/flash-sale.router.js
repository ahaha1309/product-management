const express = require('express');
const router = express.Router();
const controller = require('../../controller/client/flash-sale.controller');

router.get('/', controller.index);

module.exports = router;
