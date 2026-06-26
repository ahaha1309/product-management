const express = require('express');
const router = express.Router();
const loyaltyController = require('../../controller/admin/loyalty.controller');

// [GET] /admin/loyalty
router.get('/', loyaltyController.index);

// [POST] /admin/loyalty/add-points
router.post('/add-points', loyaltyController.addPoints);

// [POST] /admin/loyalty/deduct-points
router.post('/deduct-points', loyaltyController.deductPoints);

module.exports = router;
