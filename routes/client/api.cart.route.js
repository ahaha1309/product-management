const express = require('express');
const router = express.Router();
const apiCartController = require('../../controller/client/api.cart.controller');
const authMiddleware = require('../../middleware/client/auth.middleware');

// Protect these routes to require login
router.use(authMiddleware.requireAuth);

router.post('/add/:id', apiCartController.addProduct);
router.patch('/update-quantity/:id/:quantity', apiCartController.updateQuantity);
router.delete('/delete/:id', apiCartController.deleteProduct);

module.exports = router;
