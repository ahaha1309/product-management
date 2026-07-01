const express = require('express');
const router = express.Router();
const voucherController = require('../../controller/client/voucher.controller');

router.get('/', voucherController.index);
router.post('/spin', voucherController.spin);

module.exports = router;
