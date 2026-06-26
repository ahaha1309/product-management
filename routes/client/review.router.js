const express = require('express');
const router = express.Router();
const reviewController = require('../../controller/client/review.controller');
const authMiddleware = require('../../middleware/client/auth.middleware');
const multer = require('multer');
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên hình ảnh!'), false);
    }
  }
});
const uploadCloud = require('../../middleware/admin/upload.cloud');

// Reviews for product
router.get('/product/:productId', reviewController.getProductReviews);

// Add review (requires auth)
router.get('/add/:productId', authMiddleware.requireAuth, reviewController.addReviewForm);
router.post('/add/:productId', 
  authMiddleware.requireAuth, 
  upload.array('images', 5), 
  uploadCloud.uploadMultiple, 
  reviewController.createReview
);

// Update review (requires auth)
router.patch('/:reviewId', authMiddleware.requireAuth, reviewController.updateReview);

// Delete review (requires auth)
router.delete('/:reviewId', authMiddleware.requireAuth, reviewController.deleteReview);

// Mark helpful
router.patch('/:reviewId/helpful', reviewController.markHelpful);

// Admin routes
router.get('/admin/pending', authMiddleware.requireAuth, reviewController.adminPending);
router.patch('/admin/:reviewId/approve', authMiddleware.requireAuth, reviewController.adminApprove);
router.get('/admin/all', authMiddleware.requireAuth, reviewController.adminAll);

module.exports = router;
