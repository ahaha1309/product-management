const express = require('express');
const router = express.Router();
const wishlistController = require('../../controller/client/wishlist.controller');
const authMiddleware = require('../../middleware/client/auth.middleware');

// Require auth cho tất cả routes wishlist
router.use(authMiddleware.requireAuth);

// Get wishlist
router.get('/', wishlistController.index);

// Add to wishlist
router.post('/add', wishlistController.add);

// Toggle wishlist
router.post('/toggle', wishlistController.toggle);

// Remove from wishlist
router.delete('/:productId', wishlistController.remove);

// Update notes
router.patch('/notes', wishlistController.updateNotes);

// Check if in wishlist
router.get('/check/:productId', wishlistController.isInWishlist);

// Share wishlist
router.post('/share', wishlistController.shareWishlist);

module.exports = router;
