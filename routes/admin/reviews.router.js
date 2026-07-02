const express = require('express');
const router = express.Router();
const reviewController = require('../../controller/client/review.controller');

// Admin review management
router.get('/', reviewController.adminAll);
router.get('/pending', (req, res) => res.redirect('/admin/reviews?status=pending'));
router.patch('/:reviewId/approve', reviewController.adminApprove);
router.get('/all', reviewController.adminAll);

module.exports = router;
