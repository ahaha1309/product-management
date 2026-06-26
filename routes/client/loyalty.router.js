const express = require('express');
const router = express.Router();
const loyaltyController = require('../../controller/client/loyalty.controller');
const authMiddleware = require('../../middleware/client/auth.middleware');

// Require auth cho tất cả routes
router.use(authMiddleware.requireAuth);

// Get loyalty info (index page / landing page for members)
router.get('/', loyaltyController.getUserLoyalty);

// Register
router.get('/register', loyaltyController.getRegister);
router.post('/register', loyaltyController.postRegister);

// Dashboard
router.get('/dashboard', loyaltyController.dashboard);

// Redeem reward
router.post('/redeem', loyaltyController.redeemReward);

// Transaction history
router.get('/history', loyaltyController.transactionHistory);

module.exports = router;
